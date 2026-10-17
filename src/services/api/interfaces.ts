// Service Interfaces - Abstract data operations behind clean interfaces
// Allows switching between local storage (dev) and API (production) implementations

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
  UpdatePatientRequest,
  CreateDentistScheduleRequest,
  CreateBlockedScheduleRequest,
  CreateServiceRequest,
  UpdateServiceRequest,
  CreateWaitlistEntryRequest,
  CreateConsultationRequest,
  CreatePaymentRequest,
  UpdateSettingsRequest,
  RevenueSummary,
} from './types';

// ============================================
// SERVICE INTERFACES
// ============================================

export interface IAuthService {
  getCurrentUser(): User | null;
  getUsers(): User[];
  setActiveUser(userId: string): void;
  login(email: string, password: string): Promise<User>;
  logout(): Promise<void>;
  registerPatient(
    data: Omit<Patient, 'id' | 'patientNumber' | 'createdAt' | 'updatedAt' | 'noShowCount'>
  ): Promise<Patient>;
}

export interface IAppointmentService {
  getAll(params?: AppointmentListParams): Promise<PaginatedResponse<Appointment>>;
  getById(id: string): Promise<Appointment | null>;
  create(data: CreateAppointmentRequest): Promise<Appointment>;
  update(id: string, data: UpdateAppointmentRequest): Promise<Appointment | null>;
  updateStatus(
    id: string,
    status: AppointmentStatus,
    metadata?: Record<string, unknown>
  ): Promise<Appointment | null>;
  cancel(id: string, reason: string): Promise<Appointment>;
  reschedule(id: string, newDate: string, newStartTime: string): Promise<Appointment>;
  markNoShow(id: string, reason: string): Promise<Appointment>;
  createEmergency(
    data: CreateAppointmentRequest & { emergencyNotes: string; severity: 'high' | 'critical' }
  ): Promise<Appointment>;
  getAvailableSlots(
    dentistId: string,
    date: string,
    durationMinutes: number
  ): Promise<AvailableSlot[]>;
  getAlternativeDates(
    dentistId: string,
    fromDate: string,
    durationMinutes: number,
    count?: number
  ): Promise<AlternativeDate[]>;
}

export interface IPatientService {
  getAll(params?: PatientListParams): Promise<PaginatedResponse<Patient>>;
  getById(id: string): Promise<Patient | null>;
  findByPhoneOrEmail(identifier: string): Promise<Patient | null>;
  create(
    data: Omit<Patient, 'id' | 'patientNumber' | 'createdAt' | 'updatedAt' | 'noShowCount'>
  ): Promise<Patient>;
  update(id: string, data: UpdatePatientRequest): Promise<Patient | null>;
  confirmBookingEligibility(patientId: string): Promise<Patient | null>;
}

export interface IDentistService {
  getAll(): Promise<Dentist[]>;
  getById(id: string): Promise<Dentist | null>;
  getByUserId(userId: string): Promise<Dentist | null>;
  getSchedules(dentistId: string): Promise<DentistSchedule[]>;
  createSchedule(data: CreateDentistScheduleRequest): Promise<DentistSchedule>;
  updateSchedule(id: string, data: Partial<CreateDentistScheduleRequest>): Promise<DentistSchedule>;
  deleteSchedule(id: string): Promise<void>;
}

export interface IBlockedScheduleService {
  getAll(): Promise<BlockedSchedule[]>;
  create(data: CreateBlockedScheduleRequest): Promise<BlockedSchedule>;
  delete(id: string): Promise<void>;
}

export interface IServiceService {
  getAll(): Promise<DentalService[]>;
  getById(id: string): Promise<DentalService | null>;
  create(data: CreateServiceRequest): Promise<DentalService>;
  update(id: string, data: UpdateServiceRequest): Promise<DentalService | null>;
  delete(id: string): Promise<void>;
}

export interface IWaitlistService {
  getAll(params?: WaitlistListParams): Promise<PaginatedResponse<WaitlistEntry>>;
  join(data: CreateWaitlistEntryRequest): Promise<WaitlistEntry>;
  leave(id: string): Promise<void>;
}

export interface IConsultationService {
  getAll(params?: ConsultationListParams): Promise<PaginatedResponse<Consultation>>;
  getById(id: string): Promise<Consultation | null>;
  create(data: CreateConsultationRequest): Promise<Consultation>;
}

export interface IPaymentService {
  getAll(params?: PaymentListParams): Promise<PaginatedResponse<Payment>>;
  getById(id: string): Promise<Payment | null>;
  create(data: CreatePaymentRequest): Promise<Payment>;
  getRevenueSummary(dateFrom: string, dateTo: string): Promise<RevenueSummary>;
}

export interface INotificationService {
  getAll(params?: NotificationListParams): Promise<PaginatedResponse<AppNotification>>;
  markAsRead(notificationId: string): Promise<void>;
  markAllAsRead(userId?: string): Promise<void>;
}

export interface IAuditService {
  getAll(params?: AuditListParams): Promise<PaginatedResponse<AuditLog>>;
}

export interface ISettingsService {
  get(): Promise<SystemSettings>;
  update(data: UpdateSettingsRequest): Promise<SystemSettings>;
}

export interface IReportService {
  generateReport(
    type: 'appointments' | 'payments' | 'patients' | 'audit' | 'waitlist',
    format: 'csv' | 'json' | 'pdf',
    filters?: Record<string, unknown>
  ): Promise<Blob>;
  downloadReport(
    type: 'appointments' | 'payments' | 'patients' | 'audit' | 'waitlist',
    format: 'csv' | 'json' | 'pdf',
    filters?: Record<string, unknown>
  ): Promise<void>;
}

// ============================================
// SERVICE FACTORY TYPE
// ============================================

export interface Services {
  auth: IAuthService;
  appointments: IAppointmentService;
  patients: IPatientService;
  dentists: IDentistService;
  blockedSchedules: IBlockedScheduleService;
  services: IServiceService;
  waitlist: IWaitlistService;
  consultations: IConsultationService;
  payments: IPaymentService;
  notifications: INotificationService;
  audit: IAuditService;
  settings: ISettingsService;
  reports: IReportService;
}

// ============================================
// IMPLEMENTATION MODE
// ============================================

export type ServiceMode = 'local' | 'api';

export function getServiceMode(): ServiceMode {
  // Use local storage in development, API in production
  return import.meta.env.PROD ? 'api' : 'local';
}

export function isLocalMode(): boolean {
  return getServiceMode() === 'local';
}

export function isApiMode(): boolean {
  return getServiceMode() === 'api';
}
