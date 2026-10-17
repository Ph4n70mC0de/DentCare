// Local Service Implementation - Wraps existing dentalStore for development
// This allows the same interface to be used in dev (localStorage) and prod (API)
// All methods return Promises to match the API interface

import { dentalStore } from '../store';
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
} from '../../types';

import type {
  PaginatedResponse,
  AppointmentListParams,
  PatientListParams,
  WaitlistListParams,
  ConsultationListParams,
  PaymentListParams,
  NotificationListParams,
  AuditListParams,
  AvailableSlot,
  AlternativeDate,
  CreateAppointmentRequest,
  UpdateAppointmentRequest,
  UpdatePatientRequest,
  CreateDentistScheduleRequest,
  CreateBlockedScheduleRequest,
  CreateServiceRequest,
  UpdateServiceRequest,
  CreateWaitlistEntryRequest,
  CreateConsultationRequest,
  CreatePaymentRequest,
  MarkNotificationsReadRequest,
  UpdateSettingsRequest,
  RevenueSummary,
} from './types';

import type {
  IAuthService,
  IAppointmentService,
  IPatientService,
  IDentistService,
  IBlockedScheduleService,
  IServiceService,
  IWaitlistService,
  IConsultationService,
  IPaymentService,
  INotificationService,
  IAuditService,
  ISettingsService,
  IReportService,
} from './interfaces';

// ============================================
// HELPER FUNCTIONS
// ============================================

function paginate<T>(
  items: T[],
  params?: { page?: number; pageSize?: number }
): PaginatedResponse<T> {
  const page = params?.page ?? 1;
  const pageSize = params?.pageSize ?? 20;
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const data = items.slice(start, end);

  return {
    data,
    meta: {
      page,
      pageSize,
      totalItems: items.length,
      totalPages: Math.ceil(items.length / pageSize),
      hasNextPage: end < items.length,
      hasPreviousPage: page > 1,
    },
  };
}

function applyFilters<T>(items: T[], filters: Record<string, unknown>): T[] {
  return items.filter((item) => {
    return Object.entries(filters).every(([key, value]) => {
      if (value === undefined || value === null || value === '') return true;
      const itemValue = (item as Record<string, unknown>)[key];
      if (Array.isArray(value)) {
        return value.includes(itemValue);
      }
      return itemValue === value;
    });
  });
}

function applySearch<T>(items: T[], search?: string, searchFields: string[] = []): T[] {
  if (!search || !searchFields.length) return items;
  const term = search.toLowerCase();
  return items.filter((item) =>
    searchFields.some((field) => {
      const value = (item as Record<string, unknown>)[field];
      return value && String(value).toLowerCase().includes(term);
    })
  );
}

function applySort<T>(items: T[], sort?: { field?: string; direction?: 'asc' | 'desc' }): T[] {
  if (!sort?.field) return items;
  return [...items].sort((a, b) => {
    const aVal = (a as Record<string, unknown>)[sort.field!];
    const bVal = (b as Record<string, unknown>)[sort.field!];
    if (aVal < bVal) return sort.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return sort.direction === 'asc' ? 1 : -1;
    return 0;
  });
}

function filterAndPaginate<T>(
  items: T[],
  params?: {
    page?: number;
    pageSize?: number;
    sort?: { field?: string; direction?: 'asc' | 'desc' };
    search?: string;
    searchFields?: string[];
    [key: string]: unknown;
  }
): PaginatedResponse<T> {
  const { page, pageSize, sort, search, searchFields, ...filters } = params || {};
  let result = applyFilters(items as Record<string, unknown>[], filters);
  result = applySearch(result, search, searchFields);
  result = applySort(result, sort);
  return paginate(result as T[], { page, pageSize });
}

// Async wrapper for synchronous store operations
function asyncResult<T>(value: T): Promise<T> {
  return Promise.resolve(value);
}

function asyncVoid(): Promise<void> {
  return Promise.resolve();
}

// ============================================
// LOCAL IMPLEMENTATIONS (All methods return Promises)
// ============================================

export class LocalAuthService implements IAuthService {
  getCurrentUser(): User {
    return dentalStore.getActiveUser();
  }

  getUsers(): User[] {
    return dentalStore.getUsers();
  }

  setActiveUser(userId: string): void {
    dentalStore.setActiveUser(userId);
  }

  async login(email: string, password: string): Promise<User> {
    const users = dentalStore.getUsers();
    const user = users.find((u) => u.email === email);
    if (!user) throw new Error('Invalid credentials');
    dentalStore.setActiveUser(user.id);
    return user;
  }

  async logout(): Promise<void> {
    dentalStore.setActiveUser('user-admin');
  }

  async registerPatient(
    data: Omit<Patient, 'id' | 'patientNumber' | 'createdAt' | 'updatedAt' | 'noShowCount'>
  ): Promise<Patient> {
    return dentalStore.registerPatient(data);
  }
}

export class LocalAppointmentService implements IAppointmentService {
  async getAll(params?: AppointmentListParams): Promise<PaginatedResponse<Appointment>> {
    const appointments = dentalStore.getAppointments();
    return filterAndPaginate(appointments, {
      ...params,
      searchFields: ['appointmentNumber', 'notes'],
    });
  }

  async getById(id: string): Promise<Appointment | null> {
    return dentalStore.getAppointments().find((a) => a.id === id) ?? null;
  }

  async create(data: CreateAppointmentRequest): Promise<Appointment> {
    return dentalStore.createAppointment(data);
  }

  async update(id: string, data: UpdateAppointmentRequest): Promise<Appointment | null> {
    if (data.status) {
      return dentalStore.updateAppointmentStatus(id, data.status, data.metadata);
    }
    return null;
  }

  async updateStatus(
    id: string,
    status: AppointmentStatus,
    metadata?: Record<string, unknown>
  ): Promise<Appointment | null> {
    return dentalStore.updateAppointmentStatus(id, status, metadata);
  }

  async cancel(id: string, reason: string): Promise<Appointment> {
    const result = dentalStore.cancelAppointment(id, reason);
    // Return the cancelled appointment
    const appointment = dentalStore.getAppointments().find((a) => a.id === id);
    if (!appointment) throw new Error('Appointment not found after cancellation');
    return appointment;
  }

  async reschedule(id: string, newDate: string, newStartTime: string): Promise<Appointment> {
    const result = dentalStore.rescheduleAppointment(id, newDate, newStartTime);
    if (!result.success || !result.newAppointment) {
      throw new Error(result.error || 'Reschedule failed');
    }
    return result.newAppointment;
  }

  async markNoShow(id: string, reason: string): Promise<Appointment> {
    const result = dentalStore.markNoShow(id, reason);
    if (!result.success) {
      throw new Error('Mark no-show failed');
    }
    const appointment = dentalStore.getAppointments().find((a) => a.id === id);
    if (!appointment) throw new Error('Appointment not found after no-show');
    return appointment;
  }

  async createEmergency(
    data: CreateAppointmentRequest & { emergencyNotes: string; severity: 'high' | 'critical' }
  ): Promise<Appointment> {
    const result = dentalStore.createEmergencyAppointment(data);
    return result.appointment;
  }

  async getAvailableSlots(
    dentistId: string,
    date: string,
    durationMinutes: number
  ): Promise<AvailableSlot[]> {
    const slots = dentalStore.getAvailableSlotsForDate(dentistId, date, durationMinutes);
    return slots.map((s) => ({
      ...s,
      dentistId,
      date,
      durationMinutes,
    }));
  }

  async getAlternativeDates(
    dentistId: string,
    fromDate: string,
    durationMinutes: number,
    count?: number
  ): Promise<AlternativeDate[]> {
    const dates = dentalStore.getAlternativeDates(dentistId, fromDate, durationMinutes, count);
    return dates.map((date) => ({ date, availableSlots: 1 }));
  }
}

export class LocalPatientService implements IPatientService {
  async getAll(params?: PatientListParams): Promise<PaginatedResponse<Patient>> {
    const patients = dentalStore.getPatients();
    return filterAndPaginate(patients, {
      ...params,
      searchFields: ['fullName', 'patientNumber', 'phone', 'email'],
    });
  }

  async getById(id: string): Promise<Patient | null> {
    return dentalStore.getPatients().find((p) => p.id === id) ?? null;
  }

  async findByPhoneOrEmail(identifier: string): Promise<Patient | null> {
    return dentalStore.findPatientByPhoneOrEmail(identifier) ?? null;
  }

  async create(
    data: Omit<Patient, 'id' | 'patientNumber' | 'createdAt' | 'updatedAt' | 'noShowCount'>
  ): Promise<Patient> {
    return dentalStore.registerPatient(data);
  }

  async update(id: string, data: UpdatePatientRequest): Promise<Patient | null> {
    return dentalStore.updatePatient(id, data);
  }

  async confirmBookingEligibility(patientId: string): Promise<Patient | null> {
    return dentalStore.confirmPatientBookingEligibility(patientId);
  }
}

export class LocalDentistService implements IDentistService {
  async getAll(): Promise<Dentist[]> {
    return dentalStore.getDentists();
  }

  async getById(id: string): Promise<Dentist | null> {
    return dentalStore.getDentists().find((d) => d.id === id) ?? null;
  }

  async getByUserId(userId: string): Promise<Dentist | null> {
    return dentalStore.getDentists().find((d) => d.userId === userId) ?? null;
  }

  async getSchedules(dentistId: string): Promise<DentistSchedule[]> {
    return dentalStore.getSchedules().filter((s) => s.dentistId === dentistId);
  }

  async createSchedule(data: CreateDentistScheduleRequest): Promise<DentistSchedule> {
    return {
      id: `sched-${Date.now()}`,
      ...data,
      active: true,
    };
  }

  async updateSchedule(
    id: string,
    data: Partial<CreateDentistScheduleRequest>
  ): Promise<DentistSchedule> {
    return {
      id,
      dentistId: data.dentistId || '',
      dayOfWeek: data.dayOfWeek || 0,
      startTime: data.startTime || '09:00',
      endTime: data.endTime || '17:00',
      breakStart: data.breakStart || '12:00',
      breakEnd: data.breakEnd || '13:00',
      active: true,
    };
  }

  async deleteSchedule(id: string): Promise<void> {
    // Local store doesn't have this
  }
}

export class LocalBlockedScheduleService implements IBlockedScheduleService {
  async getAll(): Promise<BlockedSchedule[]> {
    return dentalStore.getBlockedSchedules();
  }

  async create(data: CreateBlockedScheduleRequest): Promise<BlockedSchedule> {
    return dentalStore.addBlockedSchedule(data);
  }

  async delete(id: string): Promise<void> {
    dentalStore.removeBlockedSchedule(id);
  }
}

export class LocalServiceService implements IServiceService {
  async getAll(): Promise<DentalService[]> {
    return dentalStore.getServices();
  }

  async getById(id: string): Promise<DentalService | null> {
    return dentalStore.getServices().find((s) => s.id === id) ?? null;
  }

  async create(data: CreateServiceRequest): Promise<DentalService> {
    return dentalStore.addService(data);
  }

  async update(id: string, data: UpdateServiceRequest): Promise<DentalService | null> {
    dentalStore.updateService(id, data);
    return dentalStore.getServices().find((s) => s.id === id) ?? null;
  }

  async delete(id: string): Promise<void> {
    // Local store doesn't have delete
  }
}

export class LocalWaitlistService implements IWaitlistService {
  async getAll(params?: WaitlistListParams): Promise<PaginatedResponse<WaitlistEntry>> {
    const waitlist = dentalStore.getWaitlist();
    return filterAndPaginate(waitlist, {
      ...params,
      searchFields: ['notes'],
    });
  }

  async join(data: CreateWaitlistEntryRequest): Promise<WaitlistEntry> {
    return dentalStore.joinWaitlist(data);
  }

  async leave(id: string): Promise<void> {
    dentalStore.leaveWaitlist(id);
  }
}

export class LocalConsultationService implements IConsultationService {
  async getAll(params?: ConsultationListParams): Promise<PaginatedResponse<Consultation>> {
    const consultations = dentalStore.getConsultations();
    return filterAndPaginate(consultations, {
      ...params,
      searchFields: ['diagnosis', 'treatmentPlan'],
    });
  }

  async getById(id: string): Promise<Consultation | null> {
    return dentalStore.getConsultations().find((c) => c.id === id) ?? null;
  }

  async create(data: CreateConsultationRequest): Promise<Consultation> {
    // Map prescriptions to add IDs
    const prescriptionsWithIds = data.prescriptions.map((p) => ({
      ...p,
      id: `rx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    }));
    return dentalStore.saveConsultation({
      ...data,
      prescriptions: prescriptionsWithIds,
    });
  }
}

export class LocalPaymentService implements IPaymentService {
  async getAll(params?: PaymentListParams): Promise<PaginatedResponse<Payment>> {
    const payments = dentalStore.getPayments();
    return filterAndPaginate(payments, {
      ...params,
      searchFields: ['receiptNumber'],
    });
  }

  async getById(id: string): Promise<Payment | null> {
    return dentalStore.getPayments().find((p) => p.id === id) ?? null;
  }

  async create(data: CreatePaymentRequest): Promise<Payment> {
    return dentalStore.processPayment(data);
  }

  async getRevenueSummary(dateFrom: string, dateTo: string): Promise<RevenueSummary> {
    const payments = dentalStore.getPayments().filter((p) => {
      const date = p.createdAt.split('T')[0];
      return date >= dateFrom && date <= dateTo;
    });

    const totalRevenue = payments.reduce((sum, p) => sum + p.amountPaid, 0);
    const cashTotal = payments
      .filter((p) => p.paymentMethod === 'Cash')
      .reduce((sum, p) => sum + p.amountPaid, 0);
    const cardTotal = payments
      .filter((p) => p.paymentMethod === 'Credit Card' || p.paymentMethod === 'Debit Card')
      .reduce((sum, p) => sum + p.amountPaid, 0);
    const insuranceTotal = payments
      .filter((p) => p.paymentMethod === 'Insurance')
      .reduce((sum, p) => sum + p.amountPaid, 0);

    return {
      totalRevenue,
      totalTransactions: payments.length,
      cashTotal,
      cardTotal,
      insuranceTotal,
      period: { from: dateFrom, to: dateTo },
    };
  }
}

export class LocalNotificationService implements INotificationService {
  async getAll(params?: NotificationListParams): Promise<PaginatedResponse<AppNotification>> {
    const notifications = dentalStore.getNotifications();
    return filterAndPaginate(notifications, {
      ...params,
      searchFields: ['title', 'message'],
    });
  }

  async markAsRead(notificationId: string): Promise<void> {
    dentalStore.markNotificationAsRead(notificationId);
  }

  async markAllAsRead(userId?: string): Promise<void> {
    dentalStore.markAllNotificationsAsRead(userId);
  }
}

export class LocalAuditService implements IAuditService {
  async getAll(params?: AuditListParams): Promise<PaginatedResponse<AuditLog>> {
    const logs = dentalStore.getAuditLogs();
    return filterAndPaginate(logs, {
      ...params,
      searchFields: ['action', 'details'],
    });
  }
}

export class LocalSettingsService implements ISettingsService {
  async get(): Promise<SystemSettings> {
    return dentalStore.getSettings();
  }

  async update(data: UpdateSettingsRequest): Promise<SystemSettings> {
    dentalStore.updateSettings(data);
    return dentalStore.getSettings();
  }
}

export class LocalReportService implements IReportService {
  async generateReport(
    type: 'appointments' | 'payments' | 'patients' | 'audit' | 'waitlist',
    format: 'csv' | 'json' | 'pdf',
    filters?: Record<string, unknown>
  ): Promise<Blob> {
    const data = this.getReportData(type, filters);
    const csv = this.toCSV(data);
    return new Blob([csv], { type: 'text/csv' });
  }

  async downloadReport(
    type: 'appointments' | 'payments' | 'patients' | 'audit' | 'waitlist',
    format: 'csv' | 'json' | 'pdf',
    filters?: Record<string, unknown>
  ): Promise<void> {
    const blob = await this.generateReport(type, format, filters);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-${type}-${new Date().toISOString().split('T')[0]}.${format}`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }

  private getReportData(
    type: string,
    filters?: Record<string, unknown>
  ): Record<string, unknown>[] {
    switch (type) {
      case 'appointments':
        return dentalStore.getAppointments().map((a) => ({
          'Appointment #': a.appointmentNumber,
          Date: a.date,
          Time: `${a.startTime} - ${a.endTime}`,
          Patient: dentalStore.getPatients().find((p) => p.id === a.patientId)?.fullName || '',
          Dentist: dentalStore.getDentists().find((d) => d.id === a.dentistId)?.fullName || '',
          Service: a.serviceId,
          Status: a.status,
          Source: a.bookingSource,
        }));
      case 'payments':
        return dentalStore.getPayments().map((p) => {
          const apt = dentalStore.getAppointments().find((a) => a.id === p.appointmentId);
          const pat = dentalStore.getPatients().find((pt) => pt.id === p.patientId);
          return {
            'Receipt #': p.receiptNumber,
            'Date & Time': p.createdAt,
            Patient: pat?.fullName || '',
            Service: dentalStore.getServices().find((s) => s.id === apt?.serviceId)?.name || '',
            Subtotal: p.subtotal,
            Discount: p.discount,
            Insurance: p.insuranceCoverage,
            Provider: p.insuranceProvider || 'N/A',
            'Amount Paid': p.amountPaid,
            Method: p.paymentMethod,
            Status: p.paymentStatus,
          };
        });
      case 'patients':
        return dentalStore.getPatients().map((p) => {
          const visits = dentalStore
            .getAppointments()
            .filter((a) => a.patientId === p.id && a.status === 'Completed').length;
          const noShows = dentalStore
            .getAppointments()
            .filter((a) => a.patientId === p.id && a.status === 'No-Show').length;
          const age = p.dateOfBirth
            ? new Date().getFullYear() - new Date(p.dateOfBirth).getFullYear()
            : 'N/A';
          return {
            Name: p.fullName,
            Phone: p.phone,
            Email: p.email,
            Age: age,
            Visits: visits,
            'No-Shows': noShows,
            Status: p.requiresStaffReviewForBooking ? 'Flagged' : 'Active',
          };
        });
      case 'audit':
        return dentalStore.getAuditLogs().map((log) => ({
          Timestamp: log.timestamp,
          Actor: log.actorName,
          Role: log.actorRole,
          Action: log.action,
          Entity: log.entityType,
          'Entity ID': log.entityId,
          Details: log.details || '',
        }));
      case 'waitlist':
        return dentalStore.getWaitlist().map((w) => ({
          Patient: dentalStore.getPatients().find((p) => p.id === w.patientId)?.fullName || '',
          Service: dentalStore.getServices().find((s) => s.id === w.serviceId)?.name || '',
          'Preferred Date': w.preferredDate,
          'Time Range': w.preferredTimeRange,
          Priority: w.priority,
          Status: w.status,
          Notes: w.notes || '',
        }));
      default:
        return [];
    }
  }

  private toCSV(data: Record<string, unknown>[]): string {
    if (!data.length) return '';
    const headers = Object.keys(data[0]);
    const rows = data.map((row) =>
      headers.map((h) => `"${String(row[h] || '').replace(/"/g, '""')}"`).join(',')
    );
    return [headers.join(','), ...rows].join('\n');
  }
}

// ============================================
// LOCAL SERVICES FACTORY
// ============================================

import type { Services } from './interfaces';

export function createLocalServices(): Services {
  return {
    auth: new LocalAuthService(),
    appointments: new LocalAppointmentService(),
    patients: new LocalPatientService(),
    dentists: new LocalDentistService(),
    blockedSchedules: new LocalBlockedScheduleService(),
    services: new LocalServiceService(),
    waitlist: new LocalWaitlistService(),
    consultations: new LocalConsultationService(),
    payments: new LocalPaymentService(),
    notifications: new LocalNotificationService(),
    audit: new LocalAuditService(),
    settings: new LocalSettingsService(),
    reports: new LocalReportService(),
  };
}
