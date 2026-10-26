// API Service Implementation - Uses the API client for production
// Implements the same interfaces as local implementation

import type {
  User,
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
  CreateDentistScheduleRequest,
  CreateBlockedScheduleRequest,
  CreateServiceRequest,
  UpdateServiceRequest,
  CreateWaitlistEntryRequest,
  CreateConsultationRequest,
  CreatePaymentRequest,
  UpdateSettingsRequest,
  RevenueSummary,
  UpdatePatientRequest,
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

import { apiClient } from './client';

// ============================================
// API IMPLEMENTATIONS
// ============================================

export class ApiAuthService implements IAuthService {
  private currentUser: User | null = null;

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  async getProfile(): Promise<User | null> {
    try {
      const userProfile = await apiClient.getProfile();
      const user: User = {
        ...userProfile,
        phone: '',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.currentUser = user;
      return user;
    } catch {
      this.currentUser = null;
      return null;
    }
  }

  getUsers(): User[] {
    return [];
  }

  setActiveUser(): void {
    // No-op in API mode
  }

  async login(email: string, password: string): Promise<User> {
    const response = await apiClient.login({ email, password });
    const userProfile = response.user;
    // Map UserProfile to User (add missing properties with defaults)
    const user: User = {
      ...userProfile,
      phone: '',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.currentUser = user;
    return user;
  }

  async logout(): Promise<void> {
    await apiClient.logout();
    this.currentUser = null;
  }

  async registerPatient(
    data: Omit<Patient, 'id' | 'patientNumber' | 'createdAt' | 'updatedAt' | 'noShowCount'>
  ): Promise<Patient> {
    const response = await apiClient.registerPatient(data as never);
    return response.patient;
  }
}

export class ApiAppointmentService implements IAppointmentService {
  async getAll(params?: AppointmentListParams): Promise<PaginatedResponse<Appointment>> {
    return apiClient.getAppointments(params);
  }

  async getById(id: string): Promise<Appointment | null> {
    try {
      return await apiClient.getAppointment(id);
    } catch {
      return null;
    }
  }

  async create(data: CreateAppointmentRequest): Promise<Appointment> {
    return apiClient.createAppointment(data);
  }

  async update(id: string, data: UpdateAppointmentRequest): Promise<Appointment | null> {
    return apiClient.updateAppointment(id, data);
  }

  async updateStatus(
    id: string,
    status: AppointmentStatus,
    metadata?: Record<string, unknown>
  ): Promise<Appointment | null> {
    return apiClient.updateAppointment(id, { status, ...metadata });
  }

  async cancel(id: string, reason: string): Promise<Appointment> {
    return apiClient.cancelAppointment(id, reason);
  }

  async reschedule(id: string, newDate: string, newStartTime: string): Promise<Appointment> {
    return apiClient.rescheduleAppointment(id, { newDate, newStartTime });
  }

  async markNoShow(id: string, reason: string): Promise<Appointment> {
    return apiClient.markNoShow(id, reason);
  }

  async createEmergency(
    data: CreateAppointmentRequest & { emergencyNotes: string; severity: 'high' | 'critical' }
  ): Promise<Appointment> {
    return apiClient.createEmergencyAppointment(data);
  }

  async getAvailableSlots(
    dentistId: string,
    date: string,
    durationMinutes: number
  ): Promise<AvailableSlot[]> {
    return apiClient.getAvailableSlots(dentistId, date, durationMinutes);
  }

  async getAlternativeDates(
    dentistId: string,
    fromDate: string,
    durationMinutes: number,
    count?: number
  ): Promise<AlternativeDate[]> {
    return apiClient.getAlternativeDates(dentistId, fromDate, durationMinutes, count);
  }
}

export class ApiPatientService implements IPatientService {
  async getAll(params?: PatientListParams): Promise<PaginatedResponse<Patient>> {
    return apiClient.getPatients(params);
  }

  async getById(id: string): Promise<Patient | null> {
    try {
      return await apiClient.getPatient(id);
    } catch {
      return null;
    }
  }

  async findByPhoneOrEmail(identifier: string): Promise<Patient | null> {
    try {
      return await apiClient.findPatient(identifier);
    } catch {
      return null;
    }
  }

  async create(
    data: Omit<Patient, 'id' | 'patientNumber' | 'createdAt' | 'updatedAt' | 'noShowCount'>
  ): Promise<Patient> {
    const response = await apiClient.registerPatient(data as never);
    return response.patient;
  }

  async update(id: string, data: UpdatePatientRequest): Promise<Patient | null> {
    return apiClient.updatePatient(id, data);
  }

  async confirmBookingEligibility(): Promise<Patient | null> {
    return null;
  }
}

export class ApiDentistService implements IDentistService {
  async getAll(): Promise<Dentist[]> {
    return apiClient.getDentists();
  }

  async getById(id: string): Promise<Dentist | null> {
    try {
      return await apiClient.getDentist(id);
    } catch {
      return null;
    }
  }

  async getByUserId(userId: string): Promise<Dentist | null> {
    const dentists = await this.getAll();
    return dentists.find((d) => d.userId === userId) ?? null;
  }

  async getSchedules(dentistId: string): Promise<DentistSchedule[]> {
    return apiClient.getDentistSchedules(dentistId);
  }

  async createSchedule(data: CreateDentistScheduleRequest): Promise<DentistSchedule> {
    return apiClient.createDentistSchedule(data);
  }

  async updateSchedule(
    id: string,
    data: Partial<CreateDentistScheduleRequest>
  ): Promise<DentistSchedule> {
    return apiClient.updateDentistSchedule(id, data);
  }

  async deleteSchedule(id: string): Promise<void> {
    return apiClient.deleteDentistSchedule(id);
  }
}

export class ApiBlockedScheduleService implements IBlockedScheduleService {
  async getAll(): Promise<BlockedSchedule[]> {
    return apiClient.getBlockedSchedules();
  }

  async create(data: CreateBlockedScheduleRequest): Promise<BlockedSchedule> {
    return apiClient.createBlockedSchedule(data);
  }

  async delete(id: string): Promise<void> {
    return apiClient.deleteBlockedSchedule(id);
  }
}

export class ApiServiceService implements IServiceService {
  async getAll(): Promise<DentalService[]> {
    return apiClient.getServices();
  }

  async getById(id: string): Promise<DentalService | null> {
    try {
      return await apiClient.getService(id);
    } catch {
      return null;
    }
  }

  async create(data: CreateServiceRequest): Promise<DentalService> {
    return apiClient.createService(data);
  }

  async update(id: string, data: UpdateServiceRequest): Promise<DentalService | null> {
    return apiClient.updateService(id, data);
  }

  async delete(id: string): Promise<void> {
    return apiClient.deleteService(id);
  }
}

export class ApiWaitlistService implements IWaitlistService {
  async getAll(params?: WaitlistListParams): Promise<PaginatedResponse<WaitlistEntry>> {
    return apiClient.getWaitlist(params);
  }

  async join(data: CreateWaitlistEntryRequest): Promise<WaitlistEntry> {
    return apiClient.joinWaitlist(data);
  }

  async leave(id: string): Promise<void> {
    return apiClient.leaveWaitlist(id);
  }
}

export class ApiConsultationService implements IConsultationService {
  async getAll(params?: ConsultationListParams): Promise<PaginatedResponse<Consultation>> {
    return apiClient.getConsultations(params);
  }

  async getById(id: string): Promise<Consultation | null> {
    try {
      return await apiClient.getConsultation(id);
    } catch {
      return null;
    }
  }

  async create(data: CreateConsultationRequest): Promise<Consultation> {
    return apiClient.createConsultation(data);
  }
}

export class ApiPaymentService implements IPaymentService {
  async getAll(params?: PaymentListParams): Promise<PaginatedResponse<Payment>> {
    return apiClient.getPayments(params);
  }

  async getById(id: string): Promise<Payment | null> {
    try {
      return await apiClient.getPayment(id);
    } catch {
      return null;
    }
  }

  async create(data: CreatePaymentRequest): Promise<Payment> {
    return apiClient.createPayment(data);
  }

  async getRevenueSummary(dateFrom: string, dateTo: string): Promise<RevenueSummary> {
    return apiClient.getRevenueSummary(dateFrom, dateTo);
  }
}

export class ApiNotificationService implements INotificationService {
  async getAll(params?: NotificationListParams): Promise<PaginatedResponse<AppNotification>> {
    return apiClient.getNotifications(params);
  }

  async markAsRead(notificationId: string): Promise<void> {
    return apiClient.markNotificationsRead({ notificationIds: [notificationId] });
  }

  async markAllAsRead(userId?: string): Promise<void> {
    return apiClient.markNotificationsRead({ userId, markAllAsRead: true });
  }
}

export class ApiAuditService implements IAuditService {
  async getAll(params?: AuditListParams): Promise<PaginatedResponse<AuditLog>> {
    return apiClient.getAuditLogs(params);
  }
}

export class ApiSettingsService implements ISettingsService {
  async get(): Promise<SystemSettings> {
    return apiClient.getSettings();
  }

  async update(data: UpdateSettingsRequest): Promise<SystemSettings> {
    return apiClient.updateSettings(data);
  }
}

export class ApiReportService implements IReportService {
  async generateReport(
    type: 'appointments' | 'payments' | 'patients' | 'audit' | 'waitlist',
    format: 'csv' | 'json' | 'pdf',
    filters?: Record<string, unknown>
  ): Promise<Blob> {
    return apiClient.generateReport({ type, format, filters });
  }

  async downloadReport(
    type: 'appointments' | 'payments' | 'patients' | 'audit' | 'waitlist',
    format: 'csv' | 'json' | 'pdf',
    filters?: Record<string, unknown>
  ): Promise<void> {
    return apiClient.downloadReport({ type, format, filters });
  }
}

// ============================================
// API SERVICES FACTORY
// ============================================

import type { Services } from './interfaces';

export function createApiServices(): Services {
  return {
    auth: new ApiAuthService(),
    appointments: new ApiAppointmentService(),
    patients: new ApiPatientService(),
    dentists: new ApiDentistService(),
    blockedSchedules: new ApiBlockedScheduleService(),
    services: new ApiServiceService(),
    waitlist: new ApiWaitlistService(),
    consultations: new ApiConsultationService(),
    payments: new ApiPaymentService(),
    notifications: new ApiNotificationService(),
    audit: new ApiAuditService(),
    settings: new ApiSettingsService(),
    reports: new ApiReportService(),
  };
}
