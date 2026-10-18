import { useState, useEffect, useCallback } from 'react';
import { getServices } from './api';
import type {
  User,
  UserRole,
  Patient,
  Dentist,
  DentalService,
  DentistSchedule,
  BlockedSchedule,
  Appointment,
  AppointmentStatus,
  WaitlistEntry,
  Consultation,
  Payment,
  AppNotification,
  AuditLog,
  SystemSettings,
  BookingSource,
} from '../../types';
import type {
  CreateAppointmentRequest,
  CreateConsultationRequest,
  CreatePaymentRequest,
  CreateServiceRequest,
  CreateWaitlistEntryRequest,
  UpdatePatientRequest,
  UpdateServiceRequest,
  UpdateSettingsRequest,
} from './api/types';
import {
  initialSettings,
  initialUsers,
  initialDentists,
  initialPatients,
  initialServices,
  initialSchedules,
  initialBlockedSchedules,
  initialAppointments,
  initialWaitlist,
  initialConsultations,
  initialPayments,
  initialNotifications,
  initialAuditLogs,
  getTodayDateString,
} from '../../data/seedData';

interface BoundaryState {
  activeUserId: string;
  users: User[];
  patients: Patient[];
  dentists: Dentist[];
  services: DentalService[];
  schedules: DentistSchedule[];
  blockedSchedules: BlockedSchedule[];
  appointments: Appointment[];
  waitlist: WaitlistEntry[];
  consultations: Consultation[];
  payments: Payment[];
  notifications: AppNotification[];
  auditLogs: AuditLog[];
  settings: SystemSettings;
}

let idCounter = 0;
function createUniqueId(prefix: string): string {
  idCounter += 1;
  const time = Date.now();
  const random = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${time.toString(36)}-${idCounter.toString(36)}${random}`;
}

function nowISO(): string {
  return new Date().toISOString();
}

function toTimeString(d: Date): string {
  return d.toTimeString().slice(0, 5);
}

function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m + minutes, 0, 0);
  return toTimeString(d);
}

function calculateEndTime(startTime: string, durationMinutes: number): string {
  return addMinutes(startTime, durationMinutes);
}

function parseDayOfWeek(dateISO: string): number {
  return new Date(dateISO + 'T00:00:00').getDay();
}

let state: BoundaryState = {
  activeUserId: 'user-admin',
  users: [...initialUsers],
  patients: [...initialPatients],
  dentists: [...initialDentists],
  services: [...initialServices],
  schedules: [...initialSchedules],
  blockedSchedules: [...initialBlockedSchedules],
  appointments: [...initialAppointments],
  waitlist: [...initialWaitlist],
  consultations: [...initialConsultations],
  payments: [...initialPayments],
  notifications: [...initialNotifications],
  auditLogs: [...initialAuditLogs],
  settings: { ...initialSettings },
};

const listeners = new Set<() => void>();
function notify(): void {
  listeners.forEach((l) => {
    try {
      l();
    } catch {
      /* noop */
    }
  });
}
function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function audit(
  action: string,
  entityType: AuditLog['entityType'],
  entityId: string,
  beforeValue?: string,
  afterValue?: string
): void {
  const user = state.users.find((u) => u.id === state.activeUserId);
  state.auditLogs.push({
    id: createUniqueId('audit'),
    actorId: state.activeUserId,
    actorName: user?.fullName || 'System',
    actorRole: (user?.role || 'front_desk') as UserRole,
    action,
    entityType,
    entityId,
    beforeValue,
    afterValue,
    timestamp: nowISO(),
  });
}


function findDentistSchedule(dentistId: string, dayOfWeek: number): DentistSchedule | undefined {
  return state.schedules.find(
    (s) => s.dentistId === dentistId && s.dayOfWeek === dayOfWeek && s.active
  );
}

function isBlocked(
  dentistId: string | undefined,
  date: string,
  startTime: string,
  endTime: string
): boolean {
  for (const b of state.blockedSchedules) {
    if (b.dentistId !== undefined && b.dentistId !== dentistId) continue;
    if (b.date !== date) continue;
    if (b.isAllDay) return true;
    const bStart = b.startTime ?? '00:00';
    const bEnd = b.endTime ?? '23:59';
    if (startTime < bEnd && endTime > bStart) return true;
  }
  return false;
}

function appointmentsOverlap(
  dentistId: string,
  date: string,
  startTime: string,
  endTime: string,
  excludeId?: string
): boolean {
  for (const a of state.appointments) {
    if (a.dentistId !== dentistId || a.date !== date) continue;
    if (a.id === excludeId) continue;
    if (a.status === 'Cancelled' || a.status === 'No-Show') continue;
    if (startTime < a.endTime && endTime > a.startTime) return true;
  }
  return false;
}

function isSlotAvailable(
  dentistId: string,
  date: string,
  startTime: string,
  durationMinutes: number,
  excludeId?: string
): boolean {
  const endTime = calculateEndTime(startTime, durationMinutes);
  const dayOfWeek = parseDayOfWeek(date);
  const schedule = findDentistSchedule(dentistId, dayOfWeek);
  if (!schedule) return false;
  if (startTime < schedule.startTime || endTime > schedule.endTime) return false;
  if (startTime < schedule.breakEnd && endTime > schedule.breakStart) return false;
  if (isBlocked(dentistId, date, startTime, endTime)) return false;
  return !appointmentsOverlap(dentistId, date, startTime, endTime, excludeId);
}

export function getAvailableSlotsForDate(
  dentistId: string,
  date: string,
  durationMinutes: number
): { time: string; available: boolean }[] {
  const slots: { time: string; available: boolean }[] = [];
  const step = Math.max(state.settings.defaultSlotDurationMinutes, 15);
  let t = state.settings.clinicOpenTime;
  const close = state.settings.clinicCloseTime;
  while (t < close) {
    const endTime = calculateEndTime(t, durationMinutes);
    if (endTime <= close) {
      slots.push({ time: t, available: isSlotAvailable(dentistId, date, t, durationMinutes) });
    }
    t = addMinutes(t, step);
  }
  return slots;
}

export function getAlternativeDates(
  dentistId: string,
  date: string,
  durationMinutes: number,
  count = 3
): string[] {
  const alternatives: string[] = [];
  const base = new Date(date + 'T00:00:00');
  const offsets = [-3, -2, -1, 1, 2, 3];
  for (const off of offsets) {
    if (alternatives.length >= count) break;
    const d = new Date(base);
    d.setDate(d.getDate() + off);
    const iso = d.toISOString().slice(0, 10);
    const slots = getAvailableSlotsForDate(dentistId, iso, durationMinutes);
    if (slots.some((s) => s.available)) alternatives.push(iso);
  }
  return alternatives;
}

function callService(promise: Promise<unknown>): void {
  void promise.catch(() => {
    /* optimistic UI already updated; swallow service errors */
  });
}

async function loadAll(): Promise<void> {
  const services = getServices();
  try {
    const [
      users,
      patientsRes,
      dentists,
      servicesRes,
      appointmentsRes,
      waitlistRes,
      consultationsRes,
      paymentsRes,
      notificationsRes,
      auditLogsRes,
      settings,
    ] = await Promise.all([
      services.auth.getUsers(),
      services.patients.getAll(),
      services.dentists.getAll(),
      services.services.getAll(),
      services.appointments.getAll(),
      services.waitlist.getAll(),
      services.consultations.getAll(),
      services.payments.getAll(),
      services.notifications.getAll(),
      services.audit.getAll(),
      services.settings.get(),
    ]);

    const patients: Patient[] = patientsRes.data;
    const serviceList: DentalService[] = servicesRes.data;
    const appointments: Appointment[] = appointmentsRes.data;
    const waitlist: WaitlistEntry[] = waitlistRes.data;
    const consultations: Consultation[] = consultationsRes.data;
    const payments: Payment[] = paymentsRes.data;
    const notifications: AppNotification[] = notificationsRes.data;
    const auditLogs: AuditLog[] = auditLogsRes.data;

    const schedules: DentistSchedule[] = [];
    for (const d of dentists) {
      try {
        const s = await services.dentists.getSchedules(d.id);
        schedules.push(...s);
      } catch {
        /* ignore per-dentist schedule errors */
      }
    }
    let blockedSchedules: BlockedSchedule[] = [];
    try {
      blockedSchedules = (await services.blockedSchedules.getAll()).data;
    } catch {
      blockedSchedules = [];
    }

    state = {
      activeUserId: state.activeUserId,
      users,
      patients,
      dentists,
      services: serviceList,
      schedules,
      blockedSchedules,
      appointments,
      waitlist,
      consultations,
      payments,
      notifications,
      auditLogs,
      settings,
    };
    notify();
  } catch {
    // If the API is unavailable (e.g. no backend in dev preview), keep existing state.
    notify();
  }
}

export function useDentalServices() {
  const [, setTick] = useState(0);

  useEffect(() => {
    const unsub = subscribe(() => setTick((t) => t + 1));
    loadAll();
    return unsub;
  }, []);

  // --- getters (synchronous reads from boundary state) ---
  const activeUser = state.users.find((u) => u.id === state.activeUserId) ?? null;
  const currentPatient =
    state.patients.find((p) => p.userId === state.activeUserId) ?? state.patients[0] ?? null;
  const currentDentist =
    state.dentists.find((d) => d.userId === state.activeUserId) ?? state.dentists[0] ?? null;

  const getUsers = useCallback(() => state.users, []);
  const getPatients = useCallback(() => state.patients, []);
  const getDentists = useCallback(() => state.dentists, []);
  const getServicesList = useCallback(() => state.services, []);
  const getSchedules = useCallback(() => state.schedules, []);
  const getBlockedSchedules = useCallback(() => state.blockedSchedules, []);
  const getAppointments = useCallback(() => state.appointments, []);
  const getWaitlist = useCallback(() => state.waitlist, []);
  const getConsultations = useCallback(() => state.consultations, []);
  const getPayments = useCallback(() => state.payments, []);
  const getNotifications = useCallback(() => state.notifications, []);
  const getAuditLogs = useCallback(() => state.auditLogs, []);
  const getSettings = useCallback(() => state.settings, []);

  const getPatientById = useCallback((id: string) => state.patients.find((p) => p.id === id), []);
  const findPatient = useCallback(
    (term: string) => {
      const q = term.toLowerCase().trim();
      return (
        state.patients.find((p) =>
          p.fullName.toLowerCase().includes(q) || p.patientNumber.toLowerCase().includes(q)
        ) ?? undefined
      );
    },
    []
  );

  // --- actions (optimistic boundary writes + API delegation) ---
  const setActiveUser = useCallback(
    (userId: string) => {
      if (import.meta.env.PROD) return;
      state.activeUserId = userId;
      notify();
    },
    []
  );

  const registerPatient = useCallback(
    (data: Omit<Patient, 'id' | 'patientNumber' | 'createdAt' | 'updatedAt'>) => {
      const patient: Patient = {
        ...data,
        id: createUniqueId('pat'),
        patientNumber: `PAT-${String(state.patients.length + 1).padStart(4, '0')}`,
        createdAt: nowISO(),
        updatedAt: nowISO(),
        noShowCount: data.noShowCount ?? 0,
        requiresStaffReviewForBooking: false,
      };
      state.patients.push(patient);
      notify();
      callService(services.patients.create(data));
      audit('PATIENT_REGISTERED', 'patient', patient.id);
      return patient;
    },
    []
  );

  const updatePatient = useCallback(
    (id: string, updates: Partial<Patient>) => {
      const idx = state.patients.findIndex((p) => p.id === id);
      if (idx === -1) return null;
      const before = state.patients[idx];
      const updated = { ...before, ...updates, updatedAt: nowISO() };
      state.patients[idx] = updated;
      notify();
      callService(services.patients.update(id, updates as UpdatePatientRequest));
      audit('PATIENT_UPDATED', 'patient', id, JSON.stringify(before), JSON.stringify(updated));
      return updated;
    },
    []
  );

  const confirmPatientBookingEligibility = useCallback(
    (patientId: string) => {
      const patient = state.patients.find((p) => p.id === patientId);
      if (!patient) return null;
      patient.requiresStaffReviewForBooking = false;
      notify();
      callService(services.patients.confirmBookingEligibility(patientId));
      audit('BOOKING_ELIGIBILITY_CONFIRMED', 'patient', patientId);
      return patient;
    },
    []
  );

  const createAppointment = useCallback(
    (data: {
      patientId: string;
      dentistId: string;
      serviceId: string;
      date: string;
      startTime: string;
      notes?: string;
      bookingSource?: BookingSource;
      isEmergency?: boolean;
      emergencySeverity?: 'high' | 'critical';
      emergencyNotes?: string;
    }) => {
      const service = state.services.find((s) => s.id === data.serviceId);
      const duration = service?.durationMinutes ?? state.settings.defaultSlotDurationMinutes;
      const endTime = calculateEndTime(data.startTime, duration);
      const appointmentNumber = `APT-${data.date.replace(/-/g, '')}-${String(
        state.appointments.filter((a) => a.date === data.date).length + 1
      ).padStart(3, '0')}`;
      const appointment: Appointment = {
        id: createUniqueId('apt'),
        appointmentNumber,
        patientId: data.patientId,
        dentistId: data.dentistId,
        serviceId: data.serviceId,
        date: data.date,
        startTime: data.startTime,
        endTime,
        status: data.isEmergency ? 'Emergency' : 'Confirmed',
        bookingSource: data.bookingSource ?? 'walk_in',
        notes: data.notes,
        isEmergency: data.isEmergency,
        emergencySeverity: data.emergencySeverity,
        emergencyNotes: data.emergencyNotes,
        queueNumber: 0,
        createdAt: nowISO(),
        updatedAt: nowISO(),
      };
      state.appointments.push(appointment);
      notify();
      const createReq: CreateAppointmentRequest = {
        patientId: data.patientId,
        dentistId: data.dentistId,
        serviceId: data.serviceId,
        date: data.date,
        startTime: data.startTime,
        notes: data.notes,
        bookingSource: data.bookingSource,
      };
      callService(services.appointments.create(createReq));
      audit('APPOINTMENT_REQUESTED', 'appointment', appointment.id, undefined, appointmentNumber);
      return appointment;
    },
    []
  );

  const updateAppointmentStatus = useCallback(
    (
      id: string,
      status: AppointmentStatus,
      meta: { actorId?: string; actorName?: string; actorRole?: UserRole; notes?: string; queueNumber?: number } = {}
    ): Appointment | null => {
      const idx = state.appointments.findIndex((a) => a.id === id);
      if (idx === -1) return null;
      const before = state.appointments[idx];
      const updated: Appointment = { ...before, status, updatedAt: nowISO() };
      if (status === 'Checked-In') {
        updated.arrivedAt = nowISO();
        updated.queueNumber = meta.queueNumber ?? 0;
      }
      if (status === 'Waiting') updated.queueNumber = meta.queueNumber ?? updated.queueNumber;
      if (status === 'In-Consultation') updated.consultationStartedAt = nowISO();
      if (status === 'Completed') updated.completedAt = nowISO();
      if (status === 'Cancelled') {
        updated.cancelledAt = nowISO();
        updated.cancelledBy = meta.actorId;
        updated.cancellationReason = meta.notes;
      }
      if (meta.notes) updated.notes = (updated.notes ? updated.notes + ' | ' : '') + meta.notes;
      state.appointments[idx] = updated;
      notify();
      callService(services.appointments.updateStatus(id, status, meta as Record<string, unknown>));
      audit('STATUS_CHANGED', 'appointment', id, before.status, status);
      return updated;
    },
    []
  );

  const cancelAppointment = useCallback(
    (id: string, reason: string) => {
      const apt = state.appointments.find((a) => a.id === id);
      if (!apt) return { success: false, notifiedWaitlistCount: 0 };
      const beforeStatus = apt.status;
      apt.status = 'Cancelled';
      apt.cancelledAt = nowISO();
      apt.cancellationReason = reason;
      apt.updatedAt = nowISO();
      notify();
      callService(services.appointments.cancel(id, reason));
      audit('APPOINTMENT_CANCELLED', 'appointment', id, beforeStatus, 'Cancelled');
      return { success: true, notifiedWaitlistCount: 0 };
    },
    []
  );

  const rescheduleAppointment = useCallback(
    (id: string, newDate: string, newStartTime: string) => {
      const apt = state.appointments.find((a) => a.id === id);
      if (!apt) return { success: false, error: 'Appointment not found' };
      const service = state.services.find((s) => s.id === apt.serviceId);
      const duration = service?.durationMinutes ?? state.settings.defaultSlotDurationMinutes;
      const endTime = calculateEndTime(newStartTime, duration);
      if (!isSlotAvailable(apt.dentistId, newDate, newStartTime, duration, id)) {
        return { success: false, error: 'Slot unavailable' };
      }
      const newApt: Appointment = {
        id: createUniqueId('apt'),
        appointmentNumber: `APT-${newDate.replace(/-/g, '')}-${String(
          state.appointments.filter((a) => a.date === newDate).length + 1
        ).padStart(3, '0')}`,
        patientId: apt.patientId,
        dentistId: apt.dentistId,
        serviceId: apt.serviceId,
        date: newDate,
        startTime: newStartTime,
        endTime,
        status: 'Confirmed',
        bookingSource: apt.bookingSource,
        notes: apt.notes,
        rescheduledFromId: apt.id,
        createdAt: nowISO(),
        updatedAt: nowISO(),
      };
      apt.status = 'Rescheduled';
      apt.updatedAt = nowISO();
      state.appointments.push(newApt);
      notify();
      callService(services.appointments.reschedule(id, newDate, newStartTime));
      audit('APPOINTMENT_RESCHEDULED', 'appointment', id, 'Rescheduled', newApt.appointmentNumber);
      return { success: true, newAppointment: newApt };
    },
    []
  );

  const markNoShow = useCallback(
    (id: string, reason: string) => {
      const apt = state.appointments.find((a) => a.id === id);
      if (!apt) return { success: false, patientRequiresReview: false };
      const beforeStatus = apt.status;
      apt.status = 'No-Show';
      apt.noShowReason = reason;
      apt.noShowAt = nowISO();
      apt.updatedAt = nowISO();
      const patient = state.patients.find((p) => p.id === apt.patientId);
      if (patient) {
        patient.noShowCount += 1;
        if (
          patient.noShowCount >= state.settings.maxNoShowsBeforeLock &&
          state.settings.requireStaffReviewOnNoShow
        ) {
          patient.requiresStaffReviewForBooking = true;
        }
      }
      notify();
      callService(services.appointments.markNoShow(id, reason));
      audit('NO_SHOW_RECORDED', 'appointment', id, beforeStatus, 'No-Show');
      return {
        success: true,
        patientRequiresReview: patient?.requiresStaffReviewForBooking ?? false,
      };
    },
    []
  );

  const createEmergencyAppointment = useCallback(
    (data: {
      patientId: string;
      dentistId: string;
      serviceId: string;
      emergencyNotes: string;
      severity: 'high' | 'critical';
    }) => {
      const service = state.services.find((s) => s.id === data.serviceId);
      const duration = service?.durationMinutes ?? state.settings.defaultSlotDurationMinutes;
      const startTime = state.settings.clinicOpenTime;
      const endTime = calculateEndTime(startTime, duration);
      const appointmentNumber = `EMR-${getTodayDateString().replace(/-/g, '')}-${String(
        state.appointments.filter((a) => a.isEmergency).length + 1
      ).padStart(3, '0')}`;
      const appointment: Appointment = {
        id: createUniqueId('apt'),
        appointmentNumber,
        patientId: data.patientId,
        dentistId: data.dentistId,
        serviceId: data.serviceId,
        date: getTodayDateString(),
        startTime,
        endTime,
        status: 'Emergency',
        bookingSource: 'walk_in',
        emergencyNotes: data.emergencyNotes,
        isEmergency: true,
        emergencySeverity: data.severity,
        queueNumber: 0,
        createdAt: nowISO(),
        updatedAt: nowISO(),
      };
      state.appointments.unshift(appointment);
      notify();
      const createReq: CreateAppointmentRequest & {
        emergencyNotes: string;
        severity: 'high' | 'critical';
      } = {
        patientId: data.patientId,
        dentistId: data.dentistId,
        serviceId: data.serviceId,
        date: appointment.date,
        startTime,
        emergencyNotes: data.emergencyNotes,
        severity: data.severity,
      };
      callService(services.appointments.createEmergency(createReq));
      audit('APPOINTMENT_REQUESTED', 'appointment', appointment.id, undefined, appointmentNumber);
      return { appointment, affectedWaitingPatientsCount: 0 };
    },
    []
  );

  const joinWaitlist = useCallback(
    (data: Omit<WaitlistEntry, 'id' | 'createdAt'>) => {
      const entry: WaitlistEntry = { ...data, id: createUniqueId('wl'), createdAt: nowISO() };
      state.waitlist.push(entry);
      notify();
      const createReq: CreateWaitlistEntryRequest = {
        patientId: data.patientId,
        preferredDentistId: data.preferredDentistId,
        serviceId: data.serviceId,
        preferredDate: data.preferredDate,
        preferredTimeRange: data.preferredTimeRange,
        priority: data.priority,
        notes: data.notes,
      };
      callService(services.waitlist.join(createReq));
      audit('WAITLIST_JOINED', 'waitlist', entry.id);
      return entry;
    },
    []
  );

  const cancelWaitlistEntry = useCallback((id: string) => {
    const entry = state.waitlist.find((w) => w.id === id);
    if (entry) {
      entry.status = 'cancelled';
      notify();
      callService(services.waitlist.leave(id));
      audit('WAITLIST_CANCELLED', 'waitlist', id);
    }
  }, []);

  const leaveWaitlist = useCallback((id: string) => {
    cancelWaitlistEntry(id);
  }, [cancelWaitlistEntry]);

  const scheduleFollowUpReminder = useCallback(
    (appointmentId: string): Appointment | null => {
      const apt = state.appointments.find((a) => a.id === appointmentId);
      if (!apt) return null;
      apt.followUpReminderScheduledFor = nowISO();
      notify();
      audit('FOLLOW_UP_SCHEDULED', 'appointment', appointmentId);
      return apt;
    },
    []
  );

  const processScheduledReminders = useCallback((): number => {
    let sent = 0;
    for (const apt of state.appointments) {
      if (apt.followUpReminderScheduledFor && !apt.followUpReminderSentAt) {
        apt.followUpReminderSentAt = nowISO();
        sent += 1;
      }
    }
    if (sent > 0) notify();
    return sent;
  }, []);

  const sendNotification = useCallback(
    (notif: Omit<AppNotification, 'id' | 'sentAt' | 'read'>) => {
      const notification: AppNotification = {
        ...notif,
        id: createUniqueId('notif'),
        sentAt: nowISO(),
        read: false,
      };
      state.notifications.push(notification);
      notify();
      audit(
        'NOTIFICATION_SENT',
        'appointment',
        notification.relatedAppointmentId ?? notification.id
      );
      return notification;
    },
    []
  );

  const saveConsultation = useCallback(
    (data: Omit<Consultation, 'id' | 'createdAt' | 'updatedAt'>) => {
      const consultation: Consultation = {
        ...data,
        id: createUniqueId('con'),
        createdAt: nowISO(),
        updatedAt: nowISO(),
      };
      state.consultations.push(consultation);
      const apt = state.appointments.find((a) => a.id === data.appointmentId);
      if (apt) {
        apt.status = 'Payment-Pending';
        apt.updatedAt = nowISO();
      }
      notify();
      const createReq: CreateConsultationRequest = {
        appointmentId: data.appointmentId,
        dentistId: data.dentistId,
        patientId: data.patientId,
        examinationFindings: data.examinationFindings,
        diagnosis: data.diagnosis,
        treatmentPlan: data.treatmentPlan,
        proceduresPerformed: data.proceduresPerformed,
        prescriptions: (data.prescriptions || []).map(
          ({ medication, dosage, frequency, duration, instructions }) => ({
            medication,
            dosage,
            frequency,
            duration,
            instructions,
          })
        ),
        aftercareInstructions: data.aftercareInstructions,
        followUpRecommendation: data.followUpRecommendation,
      };
      callService(services.consultations.create(createReq));
      audit('CONSULTATION_SAVED', 'consultation', consultation.id);
      return consultation;
    },
    []
  );

  const processPayment = useCallback(
    (data: Omit<Payment, 'id' | 'createdAt' | 'receiptNumber'>) => {
      const payment: Payment = {
        ...data,
        id: createUniqueId('pay'),
        createdAt: nowISO(),
        receiptNumber: `RCV-${String(state.payments.length + 1).padStart(5, '0')}`,
      };
      state.payments.push(payment);
      const apt = state.appointments.find((a) => a.id === data.appointmentId);
      if (apt && data.paymentStatus === 'Paid') {
        apt.status = 'Completed';
        apt.updatedAt = nowISO();
      }
      notify();
      const createReq: CreatePaymentRequest = {
        appointmentId: data.appointmentId,
        patientId: data.patientId,
        subtotal: data.subtotal,
        discount: data.discount,
        insuranceCoverage: data.insuranceCoverage,
        insuranceProvider: data.insuranceProvider,
        insurancePolicyNumber: data.insurancePolicyNumber,
        amountPaid: data.amountPaid,
        balance: data.balance,
        paymentMethod: data.paymentMethod,
        paymentStatus: data.paymentStatus,
        notes: data.notes,
      };
      callService(services.payments.create(createReq));
      audit('PAYMENT_PROCESSED', 'payment', payment.id);
      return payment;
    },
    []
  );

  const markNotificationAsRead = useCallback((id: string) => {
    const notif = state.notifications.find((n) => n.id === id);
    if (notif) {
      notif.read = true;
      notify();
      callService(services.notifications.markAsRead(id));
    }
  }, []);

  const markAllNotificationsAsRead = useCallback((userId?: string) => {
    for (const notif of state.notifications) {
      if (!userId || notif.userId === userId || !notif.userId) notif.read = true;
    }
    notify();
    callService(services.notifications.markAllAsRead(userId));
  }, []);

  const updateSettings = useCallback((updates: Partial<SystemSettings>) => {
    state.settings = { ...state.settings, ...updates };
    notify();
    callService(services.settings.update(state.settings as UpdateSettingsRequest));
    audit('SETTINGS_UPDATED', 'settings', 'clinic');
  }, []);

  const addService = useCallback((service: Omit<DentalService, 'id'>) => {
    const s: DentalService = { ...service, id: createUniqueId('svc') };
    state.services.push(s);
    notify();
    const createReq: CreateServiceRequest = {
      name: s.name,
      description: s.description,
      category: s.category,
      durationMinutes: s.durationMinutes,
      price: s.price,
      active: s.active,
      iconName: s.iconName,
    };
    callService(services.services.create(createReq));
    audit('SERVICE_ADDED', 'service', s.id);
    return s;
  }, []);

  const updateService = useCallback((id: string, updates: Partial<DentalService>) => {
    const s = state.services.find((s) => s.id === id);
    if (s) {
      Object.assign(s, updates);
      notify();
      callService(services.services.update(id, updates as UpdateServiceRequest));
      audit('SERVICE_UPDATED', 'service', id);
    }
  }, []);

  const addBlockedSchedule = useCallback((blocked: Omit<BlockedSchedule, 'id'>) => {
    const b: BlockedSchedule = { ...blocked, id: createUniqueId('block') };
    state.blockedSchedules.push(b);
    notify();
    const createReq = {
      dentistId: b.dentistId,
      date: b.date,
      startTime: b.startTime,
      endTime: b.endTime,
      reason: b.reason,
      isAllDay: b.isAllDay,
    };
    callService(services.blockedSchedules.create(createReq));
    audit('BLOCK_ADDED', 'schedule', b.id);
    return b;
  }, []);

  const removeBlockedSchedule = useCallback((id: string) => {
    const idx = state.blockedSchedules.findIndex((b) => b.id === id);
    if (idx === -1) return;
    state.blockedSchedules.splice(idx, 1);
    notify();
    callService(services.blockedSchedules.delete(id));
    audit('BLOCK_REMOVED', 'schedule', id);
  }, []);

  const resetToSeed = useCallback(() => {
    if (import.meta.env.PROD) return;
    state = {
      activeUserId: 'user-admin',
      users: [...initialUsers],
      patients: [...initialPatients],
      dentists: [...initialDentists],
      services: [...initialServices],
      schedules: [...initialSchedules],
      blockedSchedules: [...initialBlockedSchedules],
      appointments: [...initialAppointments],
      waitlist: [...initialWaitlist],
      consultations: [...initialConsultations],
      payments: [...initialPayments],
      notifications: [...initialNotifications],
      auditLogs: [...initialAuditLogs],
      settings: { ...initialSettings },
    };
    idCounter = 0;
    notify();
    audit('RESET_TO_SEED', 'settings', 'clinic');
  }, []);

  return {
    // state
    activeUser,
    currentPatient,
    currentDentist,
    users: state.users,
    patients: state.patients,
    dentists: state.dentists,
    services: state.services,
    schedules: state.schedules,
    blockedSchedules: state.blockedSchedules,
    appointments: state.appointments,
    waitlist: state.waitlist,
    consultations: state.consultations,
    payments: state.payments,
    notifications: state.notifications,
    auditLogs: state.auditLogs,
    settings: state.settings,
    // getters
    getUsers,
    getPatients,
    getDentists,
    getServices: getServicesList,
    getSchedules,
    getBlockedSchedules,
    getAppointments,
    getWaitlist,
    getConsultations,
    getPayments,
    getNotifications,
    getAuditLogs,
    getSettings,
    getPatientById,
    findPatient,
    getAvailableSlotsForDate,
    getAlternativeDates,
    // actions
    setActiveUser,
    registerPatient,
    confirmPatientBookingEligibility,
    updatePatient,
    findPatient,
    createAppointment,
    updateAppointmentStatus,
    cancelAppointment,
    rescheduleAppointment,
    markNoShow,
    createEmergencyAppointment,
    joinWaitlist,
    leaveWaitlist,
    cancelWaitlistEntry,
    scheduleFollowUpReminder,
    processScheduledReminders,
    sendNotification,
    saveConsultation,
    processPayment,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    updateSettings,
    addService,
    updateService,
    addBlockedSchedule,
    removeBlockedSchedule,
    resetToSeed,
  };
}
