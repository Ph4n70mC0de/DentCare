import {
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
  SystemSettings
} from '../types';
import {
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
  initialSettings,
  getTodayDateString
} from '../data/seedData';

const STORAGE_KEYS = {
  USERS: 'dentcare_users',
  PATIENTS: 'dentcare_patients',
  DENTISTS: 'dentcare_dentists',
  SERVICES: 'dentcare_services',
  SCHEDULES: 'dentcare_schedules',
  BLOCKED: 'dentcare_blocked',
  APPOINTMENTS: 'dentcare_appointments',
  WAITLIST: 'dentcare_waitlist',
  CONSULTATIONS: 'dentcare_consultations',
  PAYMENTS: 'dentcare_payments',
  NOTIFICATIONS: 'dentcare_notifications',
  AUDIT_LOGS: 'dentcare_audit_logs',
  SETTINGS: 'dentcare_settings',
  ACTIVE_USER_ID: 'dentcare_active_user_id'
};

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.warn('Storage save failed:', err);
  }
}

// In-memory data store with listener pub/sub
class DentalDataStore {
  private users: User[];
  private patients: Patient[];
  private dentists: Dentist[];
  private services: DentalService[];
  private schedules: DentistSchedule[];
  private blockedSchedules: BlockedSchedule[];
  private appointments: Appointment[];
  private waitlist: WaitlistEntry[];
  private consultations: Consultation[];
  private payments: Payment[];
  private notifications: AppNotification[];
  private auditLogs: AuditLog[];
  private settings: SystemSettings;
  private activeUserId: string;

  private listeners: Set<() => void> = new Set();

  constructor() {
    this.users = loadFromStorage<User[]>(STORAGE_KEYS.USERS, initialUsers);
    this.patients = loadFromStorage<Patient[]>(STORAGE_KEYS.PATIENTS, initialPatients);
    this.dentists = loadFromStorage<Dentist[]>(STORAGE_KEYS.DENTISTS, initialDentists);
    this.services = loadFromStorage<DentalService[]>(STORAGE_KEYS.SERVICES, initialServices);
    this.schedules = loadFromStorage<DentistSchedule[]>(STORAGE_KEYS.SCHEDULES, initialSchedules);
    this.blockedSchedules = loadFromStorage<BlockedSchedule[]>(STORAGE_KEYS.BLOCKED, initialBlockedSchedules);
    this.appointments = loadFromStorage<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, initialAppointments);
    this.waitlist = loadFromStorage<WaitlistEntry[]>(STORAGE_KEYS.WAITLIST, initialWaitlist);
    this.consultations = loadFromStorage<Consultation[]>(STORAGE_KEYS.CONSULTATIONS, initialConsultations);
    this.payments = loadFromStorage<Payment[]>(STORAGE_KEYS.PAYMENTS, initialPayments);
    this.notifications = loadFromStorage<AppNotification[]>(STORAGE_KEYS.NOTIFICATIONS, initialNotifications);
    this.auditLogs = loadFromStorage<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, initialAuditLogs);
    this.settings = loadFromStorage<SystemSettings>(STORAGE_KEYS.SETTINGS, initialSettings);
    this.activeUserId = loadFromStorage<string>(STORAGE_KEYS.ACTIVE_USER_ID, 'user-admin');
    this.processScheduledReminders();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch (err) {
        console.error('Listener callback error:', err);
      }
    });
  }

  // --- Getters ---
  public getUsers(): User[] { return [...this.users]; }
  public getPatients(): Patient[] { return [...this.patients]; }
  public getDentists(): Dentist[] { return [...this.dentists]; }
  public getServices(): DentalService[] { return [...this.services]; }
  public getSchedules(): DentistSchedule[] { return [...this.schedules]; }
  public getBlockedSchedules(): BlockedSchedule[] { return [...this.blockedSchedules]; }
  public getAppointments(): Appointment[] { return [...this.appointments]; }
  public getWaitlist(): WaitlistEntry[] { return [...this.waitlist]; }
  public getConsultations(): Consultation[] { return [...this.consultations]; }
  public getPayments(): Payment[] { return [...this.payments]; }
  public getNotifications(): AppNotification[] { return [...this.notifications]; }
  public getAuditLogs(): AuditLog[] { return [...this.auditLogs]; }
  public getSettings(): SystemSettings { return { ...this.settings }; }
  public getActiveUserId(): string { return this.activeUserId; }

  public getActiveUser(): User {
    const user = this.users.find((u) => u.id === this.activeUserId);
    return user || this.users[0];
  }

  public setActiveUser(userId: string): void {
    const user = this.users.find((u) => u.id === userId);
    if (user) {
      this.activeUserId = userId;
      saveToStorage(STORAGE_KEYS.ACTIVE_USER_ID, userId);
      this.logAudit({
        actorId: user.id,
        actorName: user.fullName,
        actorRole: user.role,
        action: 'User Switched Role/Session',
        entityType: 'settings',
        entityId: user.id,
        details: `Active role switched to ${user.role}`
      });
      this.notify();
    }
  }

  public resetToSeed(): void {
    this.users = initialUsers;
    this.patients = initialPatients;
    this.dentists = initialDentists;
    this.services = initialServices;
    this.schedules = initialSchedules;
    this.blockedSchedules = initialBlockedSchedules;
    this.appointments = initialAppointments;
    this.waitlist = initialWaitlist;
    this.consultations = initialConsultations;
    this.payments = initialPayments;
    this.notifications = initialNotifications;
    this.auditLogs = initialAuditLogs;
    this.settings = initialSettings;
    this.activeUserId = 'user-admin';

    Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
    this.notify();
  }

  // --- Audit Logging ---
  public logAudit(entry: Omit<AuditLog, 'id' | 'timestamp'>): void {
    const newLog: AuditLog = {
      ...entry,
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString()
    };
    this.auditLogs = [newLog, ...this.auditLogs];
    saveToStorage(STORAGE_KEYS.AUDIT_LOGS, this.auditLogs);
  }

  // --- Scheduled Reminder Processing ---
  public scheduleFollowUpReminder(appointmentId: string): Appointment | null {
    const index = this.appointments.findIndex((a) => a.id === appointmentId);
    if (index === -1) return null;

    const appointment = this.appointments[index];
    const reminderDate = new Date(`${appointment.date}T${appointment.startTime}:00`);
    reminderDate.setHours(reminderDate.getHours() - 24);

    const updated: Appointment = {
      ...appointment,
      followUpReminderScheduledFor: reminderDate.toISOString(),
      followUpReminderSentAt: undefined,
      updatedAt: new Date().toISOString()
    };

    this.appointments[index] = updated;
    saveToStorage(STORAGE_KEYS.APPOINTMENTS, this.appointments);

    const patient = this.patients.find((p) => p.id === appointment.patientId);
    const dentist = this.dentists.find((d) => d.id === appointment.dentistId);
    const actor = this.getActiveUser();
    this.logAudit({
      actorId: actor.id,
      actorName: actor.fullName,
      actorRole: actor.role,
      action: 'Follow-Up Reminder Scheduled',
      entityType: 'appointment',
      entityId: appointmentId,
      afterValue: reminderDate.toISOString(),
      details: `24-hour reminder scheduled for ${patient?.fullName || 'patient'} before ${appointment.date} ${appointment.startTime}`
    });

    this.notify();
    return updated;
  }

  public processScheduledReminders(): number {
    const now = Date.now();
    let sentCount = 0;

    this.appointments.forEach((appointment, index) => {
      if (!appointment.followUpReminderScheduledFor || appointment.followUpReminderSentAt) return;
      if (new Date(appointment.followUpReminderScheduledFor).getTime() > now) return;
      if (appointment.status === 'Cancelled' || appointment.status === 'No-Show') return;

      const patient = this.patients.find((p) => p.id === appointment.patientId);
      const dentist = this.dentists.find((d) => d.id === appointment.dentistId);
      const service = this.services.find((s) => s.id === appointment.serviceId);
      if (!patient) return;

      const message = `Reminder: your follow-up appointment is tomorrow, ${appointment.date} at ${appointment.startTime}, with ${dentist?.fullName || 'your dentist'} for ${service?.name || 'your dental visit'}.`;
      this.sendNotification({
        userId: patient.userId,
        patientId: patient.id,
        type: 'reminder',
        title: '24-Hour Follow-Up Reminder',
        message,
        channel: 'in_app',
        relatedAppointmentId: appointment.id
      });
      this.sendNotification({
        userId: patient.userId,
        patientId: patient.id,
        type: 'reminder',
        title: '24-Hour Follow-Up Reminder',
        message,
        channel: 'sms',
        relatedAppointmentId: appointment.id
      });
      this.sendNotification({
        userId: patient.userId,
        patientId: patient.id,
        type: 'reminder',
        title: '24-Hour Follow-Up Reminder',
        message,
        channel: 'email',
        relatedAppointmentId: appointment.id
      });

      this.appointments[index] = {
        ...appointment,
        followUpReminderSentAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      sentCount++;
    });

    if (sentCount > 0) {
      saveToStorage(STORAGE_KEYS.APPOINTMENTS, this.appointments);
      this.notify();
    }

    return sentCount;
  }

  // --- Notifications Dispatcher ---
  public sendNotification(notif: Omit<AppNotification, 'id' | 'sentAt' | 'read'>): AppNotification {
    const newNotif: AppNotification = {
      ...notif,
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      read: false,
      sentAt: new Date().toISOString()
    };
    this.notifications = [newNotif, ...this.notifications];
    saveToStorage(STORAGE_KEYS.NOTIFICATIONS, this.notifications);
    return newNotif;
  }

  public markNotificationAsRead(id: string): void {
    this.notifications = this.notifications.map((n) => n.id === id ? { ...n, read: true } : n);
    saveToStorage(STORAGE_KEYS.NOTIFICATIONS, this.notifications);
    this.notify();
  }

  public markAllNotificationsAsRead(userId?: string): void {
    this.notifications = this.notifications.map((n) => {
      if (!userId || n.userId === userId) {
        return { ...n, read: true };
      }
      return n;
    });
    saveToStorage(STORAGE_KEYS.NOTIFICATIONS, this.notifications);
    this.notify();
  }

  // --- Patient Registration & Management ---
  public registerPatient(patientData: Omit<Patient, 'id' | 'patientNumber' | 'createdAt' | 'updatedAt' | 'noShowCount'>): Patient {
    const nextNum = 10000 + this.patients.length + 1;
    const patientNumber = `DC-P-${nextNum}`;
    const newPatient: Patient = {
      ...patientData,
      id: `pat-${Date.now()}`,
      patientNumber,
      noShowCount: 0,
      requiresStaffReviewForBooking: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.patients = [newPatient, ...this.patients];
    saveToStorage(STORAGE_KEYS.PATIENTS, this.patients);

    // Also link or create user account if needed
    if (!patientData.userId) {
      const newUser: User = {
        id: `user-${newPatient.id}`,
        role: 'patient',
        fullName: newPatient.fullName,
        email: newPatient.email,
        phone: newPatient.phone,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      newPatient.userId = newUser.id;
      this.users = [...this.users, newUser];
      saveToStorage(STORAGE_KEYS.USERS, this.users);
    }

    const actor = this.getActiveUser();
    this.logAudit({
      actorId: actor.id,
      actorName: actor.fullName,
      actorRole: actor.role,
      action: 'Patient Registered',
      entityType: 'patient',
      entityId: newPatient.id,
      afterValue: newPatient.fullName,
      details: `New patient record created #${patientNumber}`
    });

    this.notify();
    return newPatient;
  }

  public updatePatient(id: string, updates: Partial<Patient>): Patient | null {
    const index = this.patients.findIndex((p) => p.id === id);
    if (index === -1) return null;

    const oldPatient = this.patients[index];
    const updated: Patient = {
      ...oldPatient,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this.patients[index] = updated;
    saveToStorage(STORAGE_KEYS.PATIENTS, this.patients);

    const actor = this.getActiveUser();
    this.logAudit({
      actorId: actor.id,
      actorName: actor.fullName,
      actorRole: actor.role,
      action: 'Patient Record Updated',
      entityType: 'patient',
      entityId: id,
      beforeValue: JSON.stringify(oldPatient.allergies),
      afterValue: JSON.stringify(updated.allergies),
      details: `Updated details for ${updated.fullName}`
    });

    this.notify();
    return updated;
  }

  public findPatientByPhoneOrEmail(identifier: string): Patient | undefined {
    const term = identifier.trim().toLowerCase();
    return this.patients.find(
      (p) =>
        p.phone.replace(/\D/g, '').includes(term.replace(/\D/g, '')) ||
        p.email.toLowerCase() === term ||
        p.patientNumber.toLowerCase() === term
    );
  }

  public confirmPatientBookingEligibility(patientId: string): Patient | null {
    const index = this.patients.findIndex((p) => p.id === patientId);
    if (index === -1) return null;

    const actor = this.getActiveUser();
    if (!['front_desk', 'admin'].includes(actor.role)) return null;

    const patient = this.patients[index];
    const updated: Patient = {
      ...patient,
      requiresStaffReviewForBooking: false,
      updatedAt: new Date().toISOString()
    };
    this.patients[index] = updated;
    saveToStorage(STORAGE_KEYS.PATIENTS, this.patients);

    this.logAudit({
      actorId: actor.id,
      actorName: actor.fullName,
      actorRole: actor.role,
      action: 'Staff Confirmed Patient Booking Eligibility',
      entityType: 'patient',
      entityId: patientId,
      beforeValue: 'Booking confirmation required',
      afterValue: 'Booking permitted',
      details: `Next-booking confirmation completed for ${patient.fullName}`
    });

    this.notify();
    return updated;
  }

  // --- Appointments & Lifecycle ---
  public createAppointment(data: {
    patientId: string;
    dentistId: string;
    serviceId: string;
    date: string;
    startTime: string;
    notes?: string;
    bookingSource?: Appointment['bookingSource'];
  }): Appointment {
    const patient = this.patients.find((p) => p.id === data.patientId);
    const dentist = this.dentists.find((d) => d.id === data.dentistId);
    const service = this.services.find((s) => s.id === data.serviceId);
    const actor = this.getActiveUser();

    if (!patient) throw new Error('Patient record not found. Complete patient registration or record lookup first.');
    if (!dentist) throw new Error('Dentist record not found.');
    if (!service || !service.active) throw new Error('Selected dental service is unavailable.');
    if (patient.requiresStaffReviewForBooking && !['front_desk', 'admin'].includes(actor.role)) {
      throw new Error('This patient requires front-desk confirmation before the next booking because of a recorded no-show.');
    }

    const duration = service.durationMinutes || this.settings.defaultSlotDurationMinutes;
    const endTime = this.calculateEndTime(data.startTime, duration);
    if (!this.isSlotAvailable(data.dentistId, data.date, data.startTime, duration)) {
      throw new Error('Selected date and time is no longer available. Restart the availability check and choose another slot.');
    }

    const appointmentNumber = `DC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newApt: Appointment = {
      id: `apt-${Date.now()}`,
      appointmentNumber,
      patientId: data.patientId,
      dentistId: data.dentistId,
      serviceId: data.serviceId,
      date: data.date,
      startTime: data.startTime,
      endTime,
      status: 'Confirmed',
      bookingSource: data.bookingSource || 'online_form',
      notes: data.notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      confirmedAt: new Date().toISOString()
    };

    this.appointments = [newApt, ...this.appointments];
    saveToStorage(STORAGE_KEYS.APPOINTMENTS, this.appointments);

    // Audit
    this.logAudit({
      actorId: actor.id,
      actorName: actor.fullName,
      actorRole: actor.role,
      action: 'Appointment Booked',
      entityType: 'appointment',
      entityId: newApt.id,
      afterValue: 'Confirmed',
      details: `${service?.name} on ${data.date} at ${data.startTime} with ${dentist?.fullName}`
    });

    // Patient Notification
    if (patient) {
      this.sendNotification({
        userId: patient.userId,
        patientId: patient.id,
        type: 'appointment_confirmed',
        title: 'Appointment Confirmed',
        message: `Your appointment for ${service?.name} with ${dentist?.fullName} is confirmed for ${data.date} at ${data.startTime}.`,
        channel: 'in_app',
        relatedAppointmentId: newApt.id
      });
      // Mock SMS
      this.sendNotification({
        userId: patient.userId,
        patientId: patient.id,
        type: 'appointment_confirmed',
        title: 'SMS Sent',
        message: `DentCare: Confirmed visit with ${dentist?.fullName} on ${data.date} at ${data.startTime}. Reply CANCEL to release.`,
        channel: 'sms',
        relatedAppointmentId: newApt.id
      });
      this.sendNotification({
        userId: patient.userId,
        patientId: patient.id,
        type: 'appointment_confirmed',
        title: 'Email Confirmation',
        message: `DentCare: Your appointment with ${dentist.fullName} is confirmed for ${data.date} at ${data.startTime}.`,
        channel: 'email',
        relatedAppointmentId: newApt.id
      });
    }

    // Dentist Notification
    if (dentist) {
      this.sendNotification({
        userId: dentist.userId,
        type: 'appointment_confirmed',
        title: 'New Patient Booked',
        message: `${patient?.fullName} booked ${service?.name} on ${data.date} at ${data.startTime}.`,
        channel: 'in_app',
        relatedAppointmentId: newApt.id
      });
    }

    this.notify();
    return newApt;
  }

  public updateAppointmentStatus(appointmentId: string, newStatus: AppointmentStatus, metadata?: Record<string, unknown>): Appointment | null {
    const index = this.appointments.findIndex((a) => a.id === appointmentId);
    if (index === -1) return null;

    const oldApt = this.appointments[index];
    const actor = this.getActiveUser();

    const allowedTransitions: Record<AppointmentStatus, AppointmentStatus[]> = {
      Requested: ['Confirmed', 'Cancelled', 'Rescheduled', 'No-Show'],
      Pending: ['Confirmed', 'Cancelled', 'Rescheduled', 'No-Show'],
      Confirmed: ['Checked-In', 'Cancelled', 'Rescheduled', 'No-Show'],
      Waitlisted: ['Confirmed', 'Cancelled'],
      Rescheduled: [],
      Cancelled: [],
      'Checked-In': ['Waiting'],
      Waiting: ['In-Consultation'],
      'In-Consultation': ['Payment-Pending'],
      'Payment-Pending': ['Completed'],
      Completed: [],
      'No-Show': [],
      Emergency: ['In-Consultation']
    };

    if (oldApt.status !== newStatus && !allowedTransitions[oldApt.status].includes(newStatus)) {
      this.logAudit({
        actorId: actor.id,
        actorName: actor.fullName,
        actorRole: actor.role,
        action: 'Blocked Invalid Appointment Transition',
        entityType: 'appointment',
        entityId: appointmentId,
        beforeValue: oldApt.status,
        afterValue: newStatus,
        details: 'Transition rejected to preserve the flowchart appointment lifecycle.'
      });
      return null;
    }

    const updated: Appointment = {
      ...oldApt,
      status: newStatus,
      updatedAt: new Date().toISOString(),
      ...(metadata || {})
    };

    if (newStatus === 'Checked-In') {
      updated.arrivedAt = new Date().toISOString();
      // compute next queue number for today
      const today = getTodayDateString();
      const existingQueueToday = this.appointments
        .filter((a) => a.date === today && a.queueNumber)
        .map((a) => a.queueNumber || 0);
      const maxQueue = existingQueueToday.length > 0 ? Math.max(...existingQueueToday) : 0;
      updated.queueNumber = maxQueue + 1;
      updated.status = 'Waiting'; // Immediately moves into waiting room
    } else if (newStatus === 'In-Consultation') {
      updated.consultationStartedAt = new Date().toISOString();
    } else if (newStatus === 'Completed') {
      updated.completedAt = new Date().toISOString();
    }

    this.appointments[index] = updated;
    saveToStorage(STORAGE_KEYS.APPOINTMENTS, this.appointments);

    this.logAudit({
      actorId: actor.id,
      actorName: actor.fullName,
      actorRole: actor.role,
      action: `Status Changed to ${newStatus}`,
      entityType: 'appointment',
      entityId: appointmentId,
      beforeValue: oldApt.status,
      afterValue: newStatus,
      details: metadata ? JSON.stringify(metadata) : `Status transition: ${oldApt.status} -> ${newStatus}`
    });

    this.notify();
    return updated;
  }

  // --- Exception Flow A: Cancellation ---
  public cancelAppointment(appointmentId: string, reason: string): { success: boolean; notifiedWaitlistCount: number } {
    const apt = this.appointments.find((a) => a.id === appointmentId);
    if (!apt) return { success: false, notifiedWaitlistCount: 0 };

    const actor = this.getActiveUser();
    const beforeStatus = apt.status;

    apt.status = 'Cancelled';
    apt.cancellationReason = reason;
    apt.cancelledBy = actor.fullName;
    apt.cancelledAt = new Date().toISOString();
    apt.updatedAt = new Date().toISOString();

    saveToStorage(STORAGE_KEYS.APPOINTMENTS, this.appointments);

    this.logAudit({
      actorId: actor.id,
      actorName: actor.fullName,
      actorRole: actor.role,
      action: 'Appointment Cancelled',
      entityType: 'appointment',
      entityId: appointmentId,
      beforeValue: beforeStatus,
      afterValue: 'Cancelled',
      details: `Slot freed: ${apt.date} ${apt.startTime}-${apt.endTime}. Reason: ${reason}`
    });

    // 1. Notify Dentist
    const dentist = this.dentists.find((d) => d.id === apt.dentistId);
    const patient = this.patients.find((p) => p.id === apt.patientId);

    if (dentist) {
      this.sendNotification({
        userId: dentist.userId,
        type: 'appointment_cancelled',
        title: 'Appointment Cancelled',
        message: `Patient ${patient?.fullName || 'Patient'} cancelled their ${apt.date} at ${apt.startTime} visit. Slot is now free.`,
        channel: 'in_app',
        relatedAppointmentId: apt.id
      });
    }

    // 2. Notify Patient of cancellation confirmation
    if (patient) {
      this.sendNotification({
        userId: patient.userId,
        patientId: patient.id,
        type: 'appointment_cancelled',
        title: 'Cancellation Confirmed',
        message: `Your appointment for ${apt.date} at ${apt.startTime} has been successfully cancelled.`,
        channel: 'in_app',
        relatedAppointmentId: apt.id
      });
    }

    // 3. Trigger Waitlist Matching Logic
    let notifiedWaitlistCount = 0;
    if (this.settings.autoNotifyWaitlistOnCancel) {
      const eligibleWaitlist = this.waitlist.filter((w) => {
        if (w.status !== 'active') return false;
        if (w.preferredDate !== apt.date) return false;
        if (w.preferredDentistId && w.preferredDentistId !== apt.dentistId) return false;
        if (w.serviceId && w.serviceId !== apt.serviceId) return false;
        if (w.preferredTimeRange !== 'any') {
          const hour = Number(apt.startTime.split(':')[0]);
          if (w.preferredTimeRange === 'morning' && hour >= 12) return false;
          if (w.preferredTimeRange === 'afternoon' && hour < 12) return false;
        }
        return true;
      });

      // Sort by priority (urgent > high > normal) and timestamp
      eligibleWaitlist.sort((a, b) => {
        const pOrder = { urgent: 3, high: 2, normal: 1 };
        const diff = pOrder[b.priority] - pOrder[a.priority];
        if (diff !== 0) return diff;
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });

      eligibleWaitlist.forEach((entry) => {
        entry.status = 'notified';
        entry.notifiedAt = new Date().toISOString();
        entry.matchedAppointmentId = apt.id;
        notifiedWaitlistCount++;

        const waitPatient = this.patients.find((p) => p.id === entry.patientId);
        if (waitPatient) {
          this.sendNotification({
            userId: waitPatient.userId,
            patientId: waitPatient.id,
            type: 'waitlist_slot_available',
            title: '🎉 Waitlist Opening Available!',
            message: `A time slot on ${apt.date} at ${apt.startTime} just opened up with Dr. ${dentist?.fullName || 'DentCare'}. Please confirm to claim this slot.`,
            channel: 'in_app',
            relatedAppointmentId: apt.id
          });
          this.sendNotification({
            userId: waitPatient.userId,
            patientId: waitPatient.id,
            type: 'waitlist_slot_available',
            title: 'SMS Opening Alert',
            message: `DentCare Alert: A slot opened for ${apt.date} at ${apt.startTime}! Log in or call to claim.`,
            channel: 'sms',
            relatedAppointmentId: apt.id
          });
        }
      });

      saveToStorage(STORAGE_KEYS.WAITLIST, this.waitlist);
    }

    this.notify();
    return { success: true, notifiedWaitlistCount };
  }

  // --- Exception Flow B: Rescheduling ---
  public rescheduleAppointment(appointmentId: string, newDate: string, newStartTime: string): { success: boolean; newAppointment?: Appointment; error?: string } {
    const oldApt = this.appointments.find((a) => a.id === appointmentId);
    if (!oldApt) return { success: false, error: 'Appointment not found' };

    // Check availability first
    const service = this.services.find((s) => s.id === oldApt.serviceId);
    const duration = service ? service.durationMinutes : 45;
    const isAvailable = this.isSlotAvailable(oldApt.dentistId, newDate, newStartTime, duration, oldApt.id);

    if (!isAvailable) {
      return { success: false, error: 'Selected date and time slot is no longer available.' };
    }

    const actor = this.getActiveUser();
    const newEndTime = this.calculateEndTime(newStartTime, duration);

    // Update old appointment: status becomes Rescheduled (preserved in history)
    oldApt.status = 'Rescheduled';
    oldApt.updatedAt = new Date().toISOString();

    // Create new appointment
    const newAppointmentNumber = `DC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newApt: Appointment = {
      id: `apt-${Date.now()}`,
      appointmentNumber: newAppointmentNumber,
      patientId: oldApt.patientId,
      dentistId: oldApt.dentistId,
      serviceId: oldApt.serviceId,
      date: newDate,
      startTime: newStartTime,
      endTime: newEndTime,
      status: 'Confirmed',
      bookingSource: oldApt.bookingSource,
      notes: `Rescheduled from ${oldApt.appointmentNumber} (${oldApt.date} ${oldApt.startTime}). ${oldApt.notes || ''}`,
      rescheduledFromId: oldApt.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      confirmedAt: new Date().toISOString()
    };

    this.appointments = [newApt, ...this.appointments];
    saveToStorage(STORAGE_KEYS.APPOINTMENTS, this.appointments);

    this.logAudit({
      actorId: actor.id,
      actorName: actor.fullName,
      actorRole: actor.role,
      action: 'Appointment Rescheduled',
      entityType: 'appointment',
      entityId: newApt.id,
      beforeValue: `${oldApt.date} ${oldApt.startTime}`,
      afterValue: `${newDate} ${newStartTime}`,
      details: `Original #${oldApt.appointmentNumber} moved to #${newAppointmentNumber}`
    });

    const patient = this.patients.find((p) => p.id === oldApt.patientId);
    const dentist = this.dentists.find((d) => d.id === oldApt.dentistId);

    if (patient) {
      this.sendNotification({
        userId: patient.userId,
        patientId: patient.id,
        type: 'appointment_rescheduled',
        title: 'Appointment Rescheduled',
        message: `Your visit has been rescheduled to ${newDate} at ${newStartTime} with ${dentist?.fullName}.`,
        channel: 'in_app',
        relatedAppointmentId: newApt.id
      });
      this.sendNotification({
        userId: patient.userId,
        patientId: patient.id,
        type: 'appointment_rescheduled',
        title: 'SMS Reschedule Notice',
        message: `DentCare: Visit moved to ${newDate} at ${newStartTime}. New Ref: ${newAppointmentNumber}.`,
        channel: 'sms',
        relatedAppointmentId: newApt.id
      });
    }

    if (dentist) {
      this.sendNotification({
        userId: dentist.userId,
        type: 'appointment_rescheduled',
        title: 'Schedule Updated (Rescheduled)',
        message: `Patient ${patient?.fullName} rescheduled to ${newDate} at ${newStartTime}.`,
        channel: 'in_app',
        relatedAppointmentId: newApt.id
      });
    }

    this.notify();
    return { success: true, newAppointment: newApt };
  }

  // --- Exception Flow C: No-Show ---
  public markNoShow(appointmentId: string, reason: string): { success: boolean; patientRequiresReview: boolean } {
    const apt = this.appointments.find((a) => a.id === appointmentId);
    if (!apt) return { success: false, patientRequiresReview: false };

    const actor = this.getActiveUser();
    apt.status = 'No-Show';
    apt.noShowReason = reason;
    apt.noShowMarkedBy = actor.fullName;
    apt.noShowAt = new Date().toISOString();
    apt.updatedAt = new Date().toISOString();

    saveToStorage(STORAGE_KEYS.APPOINTMENTS, this.appointments);

    let patientRequiresReview = false;
    const patient = this.patients.find((p) => p.id === apt.patientId);
    if (patient) {
      patient.noShowCount = (patient.noShowCount || 0) + 1;
      // Flowchart rule: after a no-show, require staff confirmation for the next booking.
      patient.requiresStaffReviewForBooking = true;
      patientRequiresReview = true;
      patient.updatedAt = new Date().toISOString();
      saveToStorage(STORAGE_KEYS.PATIENTS, this.patients);

      // Notify Patient
      this.sendNotification({
        userId: patient.userId,
        patientId: patient.id,
        type: 'no_show_notice',
        title: 'Missed Appointment (No-Show Recorded)',
        message: `You were marked as a no-show for your appointment on ${apt.date} at ${apt.startTime}. Reason noted: ${reason}. Total no-shows: ${patient.noShowCount}. ${patientRequiresReview ? 'Please contact the front desk directly before booking future appointments.' : 'Please notify clinic 24 hours in advance to avoid booking restrictions.'}`,
        channel: 'in_app',
        relatedAppointmentId: apt.id
      });
      this.sendNotification({
        userId: patient.userId,
        patientId: patient.id,
        type: 'no_show_notice',
        title: 'No-Show Notice',
        message: `DentCare: Your appointment on ${apt.date} at ${apt.startTime} was recorded as a no-show. Front-desk confirmation is required before your next booking.`,
        channel: 'sms',
        relatedAppointmentId: apt.id
      });
    }

    this.logAudit({
      actorId: actor.id,
      actorName: actor.fullName,
      actorRole: actor.role,
      action: 'Appointment Marked No-Show',
      entityType: 'appointment',
      entityId: appointmentId,
      beforeValue: 'Confirmed/Waiting',
      afterValue: 'No-Show',
      details: `Patient: ${patient?.fullName}, Reason: ${reason}. No-show count: ${patient?.noShowCount}`
    });

    this.notify();
    return { success: true, patientRequiresReview };
  }

  // --- Exception Flow D: Emergency Scheduling ---
  public createEmergencyAppointment(data: {
    patientId: string;
    dentistId: string;
    serviceId: string;
    emergencyNotes: string;
    severity: 'high' | 'critical';
  }): { appointment: Appointment; affectedWaitingPatientsCount: number } {
    const today = getTodayDateString();
    const service = this.services.find((s) => s.id === data.serviceId);
    const duration = service ? service.durationMinutes : 30;

    // Get current time or earliest slot
    const now = new Date();
    const currentHours = String(now.getHours()).padStart(2, '0');
    const currentMinutes = String(now.getMinutes()).padStart(2, '0');
    const startTime = `${currentHours}:${currentMinutes}`;
    const endTime = this.calculateEndTime(startTime, duration);

    const appointmentNumber = `DC-EMERGENCY-${Math.floor(1000 + Math.random() * 9000)}`;

    const newApt: Appointment = {
      id: `apt-emg-${Date.now()}`,
      appointmentNumber,
      patientId: data.patientId,
      dentistId: data.dentistId,
      serviceId: data.serviceId,
      date: today,
      startTime,
      endTime,
      status: 'Emergency',
      bookingSource: 'walk_in',
      isEmergency: true,
      emergencySeverity: data.severity,
      emergencyNotes: data.emergencyNotes,
      queueNumber: 0, // Top priority queue 0!
      notes: `EMERGENCY CASE: ${data.emergencyNotes}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      confirmedAt: new Date().toISOString(),
      arrivedAt: new Date().toISOString()
    };

    this.appointments = [newApt, ...this.appointments];

    // Adjust schedule for waiting appointments
    const shiftMinutes = this.settings.emergencyBufferShiftMinutes || 20;
    const waitingAppointments = this.appointments.filter(
      (a) => a.date === today && a.dentistId === data.dentistId && (a.status === 'Waiting' || a.status === 'Checked-In')
    );

    let affectedWaitingPatientsCount = 0;
    waitingAppointments.forEach((waitingApt) => {
      if (waitingApt.id === newApt.id) return;
      affectedWaitingPatientsCount++;
      const shiftedStart = this.calculateEndTime(waitingApt.startTime, shiftMinutes);
      const shiftedEnd = this.calculateEndTime(waitingApt.endTime, shiftMinutes);
      const beforeTimes = `${waitingApt.startTime}-${waitingApt.endTime}`;
      waitingApt.startTime = shiftedStart;
      waitingApt.endTime = shiftedEnd;
      waitingApt.updatedAt = new Date().toISOString();

      const waitPat = this.patients.find((p) => p.id === waitingApt.patientId);
      if (waitPat) {
        this.sendNotification({
          userId: waitPat.userId,
          patientId: waitPat.id,
          type: 'emergency_schedule_adjustment',
          title: '🚨 Clinic Schedule Notice: Emergency Delay',
          message: `Due to an incoming critical dental emergency, consultations are delayed by approximately ${shiftMinutes} minutes. Your new estimated time is ${shiftedStart}. Thank you for your patience and understanding.`,
          channel: 'in_app',
          relatedAppointmentId: waitingApt.id
        });
        this.sendNotification({
          userId: waitPat.userId,
          patientId: waitPat.id,
          type: 'emergency_schedule_adjustment',
          title: 'Emergency Schedule Adjustment',
          message: `DentCare: Your estimated consultation time moved to ${shiftedStart} because an emergency patient was prioritized.`,
          channel: 'sms',
          relatedAppointmentId: waitingApt.id
        });
      }

      const actor = this.getActiveUser();
      this.logAudit({
        actorId: actor.id,
        actorName: actor.fullName,
        actorRole: actor.role,
        action: 'Schedule Adjusted for Emergency',
        entityType: 'appointment',
        entityId: waitingApt.id,
        beforeValue: beforeTimes,
        afterValue: `${shiftedStart}-${shiftedEnd}`,
        details: `Delayed by ${shiftMinutes} mins due to Emergency #${appointmentNumber}`
      });
    });

    saveToStorage(STORAGE_KEYS.APPOINTMENTS, this.appointments);

    const actor = this.getActiveUser();
    this.logAudit({
      actorId: actor.id,
      actorName: actor.fullName,
      actorRole: actor.role,
      action: 'Emergency Appointment Created',
      entityType: 'appointment',
      entityId: newApt.id,
      afterValue: 'Emergency',
      details: `Severity: ${data.severity}, Reason: ${data.emergencyNotes}`
    });

    this.notify();
    return { appointment: newApt, affectedWaitingPatientsCount };
  }

  // --- Waitlist Management ---
  public joinWaitlist(data: Omit<WaitlistEntry, 'id' | 'createdAt' | 'status'>): WaitlistEntry {
    const newEntry: WaitlistEntry = {
      ...data,
      id: `wait-${Date.now()}`,
      status: 'active',
      createdAt: new Date().toISOString()
    };
    this.waitlist = [newEntry, ...this.waitlist];
    saveToStorage(STORAGE_KEYS.WAITLIST, this.waitlist);

    const actor = this.getActiveUser();
    this.logAudit({
      actorId: actor.id,
      actorName: actor.fullName,
      actorRole: actor.role,
      action: 'Waitlist Joined',
      entityType: 'waitlist',
      entityId: newEntry.id,
      details: `Preferred date: ${data.preferredDate}, range: ${data.preferredTimeRange}`
    });

    this.notify();
    return newEntry;
  }

  public leaveWaitlist(waitlistId: string): void {
    this.waitlist = this.waitlist.map((w) => w.id === waitlistId ? { ...w, status: 'cancelled' } : w);
    saveToStorage(STORAGE_KEYS.WAITLIST, this.waitlist);
    this.notify();
  }

  // --- Consultations & Clinical Records ---
  public saveConsultation(data: Omit<Consultation, 'id' | 'createdAt' | 'updatedAt'>): Consultation {
    const newCons: Consultation = {
      ...data,
      id: `cons-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.consultations = [newCons, ...this.consultations];
    saveToStorage(STORAGE_KEYS.CONSULTATIONS, this.consultations);

    // Update appointment status to Payment-Pending
    this.updateAppointmentStatus(data.appointmentId, 'Payment-Pending');

    const actor = this.getActiveUser();
    this.logAudit({
      actorId: actor.id,
      actorName: actor.fullName,
      actorRole: actor.role,
      action: 'Consultation Completed',
      entityType: 'consultation',
      entityId: newCons.id,
      details: `Diagnosis: ${data.diagnosis}. Follow-up needed: ${data.followUpRecommendation?.required ? 'Yes' : 'No'}`
    });

    // Notify patient
    const patient = this.patients.find((p) => p.id === data.patientId);
    if (patient) {
      this.sendNotification({
        userId: patient.userId,
        patientId: patient.id,
        type: 'appointment_completed',
        title: 'Consultation Complete & Treatment Notes Ready',
        message: `Dr. has concluded your treatment. Diagnosis: "${data.diagnosis}". Prescriptions and aftercare instructions have been added to your profile. Please visit the front desk for payment.`,
        channel: 'in_app',
        relatedAppointmentId: data.appointmentId
      });
    }

    this.notify();
    return newCons;
  }

  // --- Payment & Billing ---
  public processPayment(data: Omit<Payment, 'id' | 'createdAt' | 'receiptNumber'>): Payment {
    const receiptNumber = `REC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newPayment: Payment = {
      ...data,
      id: `pay-${Date.now()}`,
      receiptNumber,
      createdAt: new Date().toISOString()
    };

    this.payments = [newPayment, ...this.payments];
    saveToStorage(STORAGE_KEYS.PAYMENTS, this.payments);

    // If fully paid, mark appointment Completed
    if (data.paymentStatus === 'Paid' || data.balance <= 0) {
      this.updateAppointmentStatus(data.appointmentId, 'Completed');
    }

    const actor = this.getActiveUser();
    this.logAudit({
      actorId: actor.id,
      actorName: actor.fullName,
      actorRole: actor.role,
      action: 'Payment Processed',
      entityType: 'payment',
      entityId: newPayment.id,
      afterValue: `$${data.amountPaid} (${data.paymentStatus})`,
      details: `Receipt #${receiptNumber} via ${data.paymentMethod}`
    });

    const patient = this.patients.find((p) => p.id === data.patientId);
    if (patient) {
      this.sendNotification({
        userId: patient.userId,
        patientId: patient.id,
        type: 'payment_receipt',
        title: `Payment Receipt #${receiptNumber}`,
        message: `Payment of $${data.amountPaid.toFixed(2)} received via ${data.paymentMethod}. Balance remaining: $${data.balance.toFixed(2)}.`,
        channel: 'in_app',
        relatedAppointmentId: data.appointmentId
      });
    }

    this.notify();
    return newPayment;
  }

  // --- System Settings Management ---
  public updateSettings(updates: Partial<SystemSettings>): void {
    this.settings = { ...this.settings, ...updates };
    saveToStorage(STORAGE_KEYS.SETTINGS, this.settings);
    this.notify();
  }

  // --- Dental Service Management ---
  public addService(service: Omit<DentalService, 'id'>): DentalService {
    const newService: DentalService = {
      ...service,
      id: `serv-${Date.now()}`
    };
    this.services = [...this.services, newService];
    saveToStorage(STORAGE_KEYS.SERVICES, this.services);
    this.notify();
    return newService;
  }

  public updateService(id: string, updates: Partial<DentalService>): void {
    this.services = this.services.map((s) => s.id === id ? { ...s, ...updates } : s);
    saveToStorage(STORAGE_KEYS.SERVICES, this.services);
    this.notify();
  }

  // --- Blocked Dates / Holiday Management ---
  public addBlockedSchedule(blocked: Omit<BlockedSchedule, 'id'>): BlockedSchedule {
    const newBlocked: BlockedSchedule = {
      ...blocked,
      id: `block-${Date.now()}`
    };
    this.blockedSchedules = [...this.blockedSchedules, newBlocked];
    saveToStorage(STORAGE_KEYS.BLOCKED, this.blockedSchedules);
    this.notify();
    return newBlocked;
  }

  public removeBlockedSchedule(id: string): void {
    this.blockedSchedules = this.blockedSchedules.filter((b) => b.id !== id);
    saveToStorage(STORAGE_KEYS.BLOCKED, this.blockedSchedules);
    this.notify();
  }

  // --- Schedule Availability Calculation Engine ---
  public isSlotAvailable(dentistId: string, date: string, startTime: string, durationMinutes: number, excludeAppointmentId?: string): boolean {
    const dayOfWeek = new Date(`${date}T12:00:00`).getDay(); // 0 = Sun
    const schedule = this.schedules.find((s) => s.dentistId === dentistId && s.dayOfWeek === dayOfWeek && s.active);
    if (!schedule) return false;

    // Check clinic/dentist blocked dates
    const isBlocked = this.blockedSchedules.some((b) => b.date === date && (!b.dentistId || b.dentistId === dentistId));
    if (isBlocked) return false;

    const endTime = this.calculateEndTime(startTime, durationMinutes);

    // Must be inside working hours
    if (startTime < schedule.startTime || endTime > schedule.endTime) return false;

    // Must not overlap break time
    if (!(endTime <= schedule.breakStart || startTime >= schedule.breakEnd)) return false;

    // Check overlap with existing active appointments
    const activeStatuses: AppointmentStatus[] = [
      'Requested',
      'Pending',
      'Confirmed',
      'Checked-In',
      'Waiting',
      'In-Consultation',
      'Emergency'
    ];

    const conflicts = this.appointments.filter((a) => {
      if (a.id === excludeAppointmentId) return false;
      if (a.dentistId !== dentistId || a.date !== date) return false;
      if (!activeStatuses.includes(a.status)) return false;

      // Overlap rule: startA < endB && endA > startB
      return startTime < a.endTime && endTime > a.startTime;
    });

    return conflicts.length === 0;
  }

  public getAvailableSlotsForDate(dentistId: string, date: string, durationMinutes: number): { time: string; available: boolean; reason?: string }[] {
    const dayOfWeek = new Date(`${date}T12:00:00`).getDay();
    const schedule = this.schedules.find((s) => s.dentistId === dentistId && s.dayOfWeek === dayOfWeek && s.active);

    if (!schedule) {
      return [];
    }

    const isBlocked = this.blockedSchedules.some((b) => b.date === date && (!b.dentistId || b.dentistId === dentistId));
    if (isBlocked) {
      return [];
    }

    const slots: { time: string; available: boolean; reason?: string }[] = [];
    let current = schedule.startTime;

    const [endH, endM] = schedule.endTime.split(':').map(Number);
    const endMinutesTotal = endH * 60 + endM;

    while (true) {
      const [curH, curM] = current.split(':').map(Number);
      const curMinutesTotal = curH * 60 + curM;

      if (curMinutesTotal + durationMinutes > endMinutesTotal) {
        break;
      }

      const slotEndTime = this.calculateEndTime(current, durationMinutes);

      // Check if slot falls in break
      if (!(slotEndTime <= schedule.breakStart || current >= schedule.breakEnd)) {
        slots.push({ time: current, available: false, reason: 'Dentist Lunch Break' });
      } else {
        const available = this.isSlotAvailable(dentistId, date, current, durationMinutes);
        slots.push({
          time: current,
          available,
          reason: available ? undefined : 'Already Booked'
        });
      }

      // Step by slot interval
      current = this.calculateEndTime(current, Math.min(30, durationMinutes));
    }

    return slots;
  }

  // Find alternative dates with availability if requested date has none
  public getAlternativeDates(dentistId: string, fromDate: string, durationMinutes: number, count: number = 3): string[] {
    const results: string[] = [];
    const baseDate = new Date(`${fromDate}T12:00:00`);

    for (let i = 1; i <= 14 && results.length < count; i++) {
      const checkDate = new Date(baseDate);
      checkDate.setDate(checkDate.getDate() + i);
      const dateStr = checkDate.toISOString().split('T')[0];

      const slots = this.getAvailableSlotsForDate(dentistId, dateStr, durationMinutes);
      const hasFree = slots.some((s) => s.available);
      if (hasFree) {
        results.push(dateStr);
      }
    }

    return results;
  }

  private calculateEndTime(startTime: string, durationMinutes: number): string {
    const [h, m] = startTime.split(':').map(Number);
    const totalM = h * 60 + m + durationMinutes;
    const endH = Math.floor(totalM / 60) % 24;
    const endM = totalM % 60;
    return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
  }
}

export const dentalStore = new DentalDataStore();
