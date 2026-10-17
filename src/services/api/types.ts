// API Types - Request/Response types, pagination, error formats, date conventions
// This file defines the contract between frontend and backend API

// ============================================
// DATE/TIME CONVENTIONS
// ============================================
// All dates: ISO 8601 (YYYY-MM-DD)
// All timestamps: ISO 8601 with timezone (YYYY-MM-DDTHH:mm:ss.sssZ)
// All times: HH:mm (24-hour format)
// Backend stores all datetimes in UTC; frontend converts to local for display

// ============================================
// PAGINATION & SORTING
// ============================================

export interface PaginationParams {
  page: number; // 1-based page number
  pageSize: number; // items per page (max 100)
}

export interface SortParams {
  field: string; // field name to sort by
  direction: 'asc' | 'desc';
}

export interface FilterParams {
  [key: string]: string | number | boolean | undefined | string[] | number[] | boolean[];
}

export interface ListParams extends PaginationParams, SortParams, FilterParams {}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

// ============================================
// ERROR FORMATS
// ============================================

export interface ApiError {
  code: string; // Machine-readable error code
  message: string; // Human-readable message
  statusCode: number; // HTTP status code
  details?: Record<string, unknown>; // Additional context
  timestamp: string; // ISO timestamp
  requestId?: string; // For tracing
}

export interface ValidationErrorDetail {
  field: string;
  code: string; // e.g., 'required', 'invalid_format', 'conflict'
  message: string;
}

export interface ValidationErrorResponse extends ApiError {
  code: 'VALIDATION_ERROR';
  details: {
    errors: ValidationErrorDetail[];
  };
}

export interface ConflictErrorResponse extends ApiError {
  code: 'CONFLICT';
  details: {
    resource: string;
    conflictingField: string;
    existingValue: string;
  };
}

export interface NotFoundErrorResponse extends ApiError {
  code: 'NOT_FOUND';
  details: {
    resource: string;
    identifier: string;
  };
}

export interface UnauthorizedErrorResponse extends ApiError {
  code: 'UNAUTHORIZED';
  details?: {
    reason: 'expired_token' | 'invalid_token' | 'missing_token' | 'insufficient_permissions';
  };
}

export type ApiErrorResponse =
  | ValidationErrorResponse
  | ConflictErrorResponse
  | NotFoundErrorResponse
  | UnauthorizedErrorResponse
  | ApiError;

// ============================================
// HEALTH CHECK
// ============================================

export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  timestamp: string;
  dependencies: {
    database: 'up' | 'down';
    cache: 'up' | 'down';
    auth: 'up' | 'down';
  };
}

// ============================================
// AUTH TYPES
// ============================================

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // seconds
  tokenType: 'Bearer';
  user: UserProfile;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  avatarUrl?: string;
  permissions: string[];
  lastLoginAt: string;
}

export type UserRole = 'patient' | 'front_desk' | 'dentist' | 'admin';

export interface RegisterPatientRequest {
  fullName: string;
  dateOfBirth: string; // YYYY-MM-DD
  sex: 'Male' | 'Female' | 'Other';
  phone: string;
  email: string;
  address: string;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  identificationReference: string;
  medicalAlerts: string[];
  allergies: string[];
}

export interface RegisterPatientResponse {
  patient: Patient;
  user: UserProfile;
}

// ============================================
// APPOINTMENT TYPES
// ============================================

export type AppointmentStatus =
  | 'Requested'
  | 'Pending'
  | 'Confirmed'
  | 'Waitlisted'
  | 'Rescheduled'
  | 'Cancelled'
  | 'Checked-In'
  | 'Waiting'
  | 'In-Consultation'
  | 'Payment-Pending'
  | 'Completed'
  | 'No-Show'
  | 'Emergency';

export type BookingSource = 'online_form' | 'app' | 'phone_call' | 'walk_in';

export interface Appointment {
  id: string;
  appointmentNumber: string;
  patientId: string;
  dentistId: string;
  serviceId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  status: AppointmentStatus;
  bookingSource: BookingSource;
  notes?: string;
  cancellationReason?: string;
  cancelledBy?: string;
  cancelledAt?: string;
  noShowReason?: string;
  noShowMarkedBy?: string;
  noShowAt?: string;
  isEmergency?: boolean;
  emergencySeverity?: 'high' | 'critical';
  emergencyNotes?: string;
  rescheduledFromId?: string;
  queueNumber?: number;
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
  confirmedAt?: string; // ISO timestamp
  arrivedAt?: string; // ISO timestamp
  consultationStartedAt?: string; // ISO timestamp
  completedAt?: string; // ISO timestamp
  followUpReminderScheduledFor?: string; // ISO timestamp
  followUpReminderSentAt?: string; // ISO timestamp
  // Populated via includes
  patient?: Patient;
  dentist?: Dentist;
  service?: DentalService;
}

export interface CreateAppointmentRequest {
  patientId: string;
  dentistId: string;
  serviceId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  notes?: string;
  bookingSource?: BookingSource;
}

export interface UpdateAppointmentRequest {
  status?: AppointmentStatus;
  notes?: string;
  cancellationReason?: string;
  noShowReason?: string;
  metadata?: Record<string, unknown>;
}

export interface RescheduleAppointmentRequest {
  newDate: string; // YYYY-MM-DD
  newStartTime: string; // HH:mm
}

export interface AppointmentListParams extends ListParams {
  status?: AppointmentStatus | AppointmentStatus[];
  dentistId?: string;
  patientId?: string;
  serviceId?: string;
  dateFrom?: string; // YYYY-MM-DD
  dateTo?: string; // YYYY-MM-DD
  isEmergency?: boolean;
}

export interface AvailableSlot {
  time: string; // HH:mm
  available: boolean;
  reason?: string;
  dentistId: string;
  date: string; // YYYY-MM-DD
  durationMinutes: number;
}

export interface AlternativeDate {
  date: string; // YYYY-MM-DD
  availableSlots: number;
}

// ============================================
// PATIENT TYPES
// ============================================

export interface Patient {
  id: string;
  userId?: string;
  patientNumber: string;
  fullName: string;
  dateOfBirth: string; // YYYY-MM-DD
  sex: 'Male' | 'Female' | 'Other';
  phone: string;
  email: string;
  address: string;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  identificationReference: string;
  medicalAlerts: string[];
  allergies: string[];
  noShowCount: number;
  requiresStaffReviewForBooking: boolean;
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

export interface PatientListParams extends ListParams {
  search?: string;
  status?: 'active' | 'flagged';
  dateOfBirthFrom?: string;
  dateOfBirthTo?: string;
}

export interface UpdatePatientRequest {
  phone?: string;
  email?: string;
  address?: string;
  emergencyContact?: Patient['emergencyContact'];
  medicalAlerts?: string[];
  allergies?: string[];
  requiresStaffReviewForBooking?: boolean;
}

// ============================================
// DENTIST TYPES
// ============================================

export interface Dentist {
  id: string;
  userId: string;
  fullName: string;
  licenseReference: string;
  specialization: string;
  contact: string;
  email: string;
  status: 'active' | 'on_leave' | 'inactive';
  avatarUrl?: string;
  colorCode: string;
}

export interface DentistSchedule {
  id: string;
  dentistId: string;
  dayOfWeek: number; // 0 = Sunday, ..., 6 = Saturday
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  breakStart: string; // HH:mm
  breakEnd: string; // HH:mm
  active: boolean;
}

export interface CreateDentistScheduleRequest {
  dentistId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  breakStart: string;
  breakEnd: string;
}

export interface BlockedSchedule {
  id: string;
  dentistId?: string; // undefined = whole clinic
  date: string; // YYYY-MM-DD
  startTime?: string; // HH:mm (if not all-day)
  endTime?: string; // HH:mm (if not all-day)
  reason: string;
  isAllDay: boolean;
}

export interface CreateBlockedScheduleRequest {
  dentistId?: string;
  date: string;
  startTime?: string;
  endTime?: string;
  reason: string;
  isAllDay: boolean;
}

// ============================================
// SERVICE TYPES
// ============================================

export type ServiceCategory =
  | 'General'
  | 'Restorative'
  | 'Orthodontics'
  | 'Endodontics'
  | 'Periodontics'
  | 'Cosmetic'
  | 'Surgery';

export interface DentalService {
  id: string;
  name: string;
  description: string;
  category: ServiceCategory;
  durationMinutes: number;
  price: number;
  active: boolean;
  iconName?: string;
}

export interface CreateServiceRequest {
  name: string;
  description: string;
  category: ServiceCategory;
  durationMinutes: number;
  price: number;
  active: boolean;
  iconName?: string;
}

export interface UpdateServiceRequest {
  name?: string;
  description?: string;
  category?: ServiceCategory;
  durationMinutes?: number;
  price?: number;
  active?: boolean;
  iconName?: string;
}

// ============================================
// WAITLIST TYPES
// ============================================

export type WaitlistPriority = 'normal' | 'high' | 'urgent';
export type WaitlistStatus = 'active' | 'notified' | 'booked' | 'cancelled';
export type WaitlistTimeRange = 'morning' | 'afternoon' | 'any';

export interface WaitlistEntry {
  id: string;
  patientId: string;
  preferredDentistId?: string;
  serviceId: string;
  preferredDate: string; // YYYY-MM-DD
  preferredTimeRange: WaitlistTimeRange;
  priority: WaitlistPriority;
  status: WaitlistStatus;
  notes?: string;
  createdAt: string; // ISO timestamp
  notifiedAt?: string; // ISO timestamp
  matchedAppointmentId?: string;
  // Populated via includes
  patient?: Patient;
  service?: DentalService;
  preferredDentist?: Dentist;
}

export interface CreateWaitlistEntryRequest {
  patientId: string;
  preferredDentistId?: string;
  serviceId: string;
  preferredDate: string;
  preferredTimeRange: WaitlistTimeRange;
  priority: WaitlistPriority;
  notes?: string;
}

export interface WaitlistListParams extends ListParams {
  status?: WaitlistStatus | WaitlistStatus[];
  patientId?: string;
  serviceId?: string;
  preferredDate?: string;
  priority?: WaitlistPriority;
}

// ============================================
// CONSULTATION TYPES
// ============================================

export interface PrescriptionItem {
  id: string;
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

export interface FollowUpRecommendation {
  required: boolean;
  timeframeWeeks: number;
  recommendedDate?: string; // YYYY-MM-DD
  notes: string;
}

export interface Consultation {
  id: string;
  appointmentId: string;
  dentistId: string;
  patientId: string;
  examinationFindings: string;
  diagnosis: string;
  treatmentPlan: string;
  proceduresPerformed: string[];
  prescriptions: PrescriptionItem[];
  aftercareInstructions: string;
  followUpRecommendation?: FollowUpRecommendation;
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
  // Populated via includes
  appointment?: Appointment;
  dentist?: Dentist;
  patient?: Patient;
}

export interface CreateConsultationRequest {
  appointmentId: string;
  dentistId: string;
  patientId: string;
  examinationFindings: string;
  diagnosis: string;
  treatmentPlan: string;
  proceduresPerformed: string[];
  prescriptions: Omit<PrescriptionItem, 'id'>[];
  aftercareInstructions: string;
  followUpRecommendation?: FollowUpRecommendation;
}

export interface ConsultationListParams extends ListParams {
  patientId?: string;
  dentistId?: string;
  appointmentId?: string;
  dateFrom?: string;
  dateTo?: string;
}

// ============================================
// PAYMENT TYPES
// ============================================

export type PaymentMethod = 'Cash' | 'Credit Card' | 'Debit Card' | 'Insurance' | 'Online Banking';
export type PaymentStatus = 'Pending' | 'Paid' | 'Partially-Paid' | 'Refunded';

export interface Payment {
  id: string;
  appointmentId: string;
  patientId: string;
  subtotal: number;
  discount: number;
  insuranceCoverage: number;
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
  amountPaid: number;
  balance: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  receiptNumber: string;
  notes?: string;
  createdAt: string; // ISO timestamp
  // Populated via includes
  appointment?: Appointment;
  patient?: Patient;
}

export interface CreatePaymentRequest {
  appointmentId: string;
  patientId: string;
  subtotal: number;
  discount: number;
  insuranceCoverage: number;
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
  amountPaid: number;
  balance: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  notes?: string;
}

export interface PaymentListParams extends ListParams {
  patientId?: string;
  appointmentId?: string;
  paymentMethod?: PaymentMethod;
  paymentStatus?: PaymentStatus;
  dateFrom?: string;
  dateTo?: string;
}

export interface RevenueSummary {
  totalRevenue: number;
  totalTransactions: number;
  cashTotal: number;
  cardTotal: number;
  insuranceTotal: number;
  period: {
    from: string;
    to: string;
  };
}

// ============================================
// NOTIFICATION TYPES
// ============================================

export type NotificationChannel = 'in_app' | 'sms' | 'email';
export type NotificationType =
  | 'appointment_requested'
  | 'appointment_confirmed'
  | 'appointment_rescheduled'
  | 'appointment_cancelled'
  | 'waitlist_slot_available'
  | 'reminder'
  | 'no_show_notice'
  | 'follow_up_reminder'
  | 'emergency_schedule_adjustment'
  | 'payment_receipt'
  | 'appointment_completed';

export interface AppNotification {
  id: string;
  userId?: string;
  patientId?: string;
  type: NotificationType;
  title: string;
  message: string;
  channel: NotificationChannel;
  read: boolean;
  sentAt: string; // ISO timestamp
  relatedAppointmentId?: string;
  metadata?: Record<string, unknown>;
}

export interface NotificationListParams extends ListParams {
  userId?: string;
  patientId?: string;
  type?: NotificationType;
  channel?: NotificationChannel;
  read?: boolean;
  dateFrom?: string;
  dateTo?: string;
}

export interface MarkNotificationsReadRequest {
  notificationIds?: string[];
  userId?: string;
  markAllAsRead?: boolean;
}

// ============================================
// AUDIT TYPES
// ============================================

export type AuditEntityType =
  | 'appointment'
  | 'patient'
  | 'dentist'
  | 'service'
  | 'schedule'
  | 'payment'
  | 'consultation'
  | 'waitlist'
  | 'settings';

export interface AuditLog {
  id: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  entityType: AuditEntityType;
  entityId: string;
  beforeValue?: string;
  afterValue?: string;
  details?: string;
  timestamp: string; // ISO timestamp
}

export interface AuditListParams extends ListParams {
  actorId?: string;
  actorRole?: UserRole;
  action?: string;
  entityType?: AuditEntityType;
  entityId?: string;
  dateFrom?: string;
  dateTo?: string;
}

// ============================================
// SETTINGS TYPES
// ============================================

export interface SystemSettings {
  clinicName: string;
  clinicPhone: string;
  clinicEmail: string;
  clinicAddress: string;
  clinicOpenTime: string; // HH:mm
  clinicCloseTime: string; // HH:mm
  defaultSlotDurationMinutes: number;
  bufferTimeMinutes: number;
  pendingHoldMinutes: number;
  maxNoShowsBeforeLock: number;
  requireStaffReviewOnNoShow: boolean;
  reminderLeadHours: number;
  autoNotifyWaitlistOnCancel: boolean;
  emergencyBufferShiftMinutes: number;
}

export interface UpdateSettingsRequest {
  clinicName?: string;
  clinicPhone?: string;
  clinicEmail?: string;
  clinicAddress?: string;
  clinicOpenTime?: string;
  clinicCloseTime?: string;
  defaultSlotDurationMinutes?: number;
  bufferTimeMinutes?: number;
  pendingHoldMinutes?: number;
  maxNoShowsBeforeLock?: number;
  requireStaffReviewOnNoShow?: boolean;
  reminderLeadHours?: number;
  autoNotifyWaitlistOnCancel?: boolean;
  emergencyBufferShiftMinutes?: number;
}

// ============================================
// REPORT TYPES
// ============================================

export interface AppointmentReportRow {
  appointmentNumber: string;
  date: string;
  time: string;
  patient: string;
  dentist: string;
  service: string;
  status: string;
  source: string;
}

export interface PaymentReportRow {
  receiptNumber: string;
  dateTime: string;
  patient: string;
  service: string;
  subtotal: number;
  discount: number;
  insuranceCoverage: number;
  insuranceProvider: string;
  amountPaid: number;
  paymentMethod: string;
  status: string;
}

export interface PatientReportRow {
  name: string;
  phone: string;
  email: string;
  age: string | number;
  totalVisits: number;
  noShows: number;
  status: string;
}

export interface AuditReportRow {
  timestamp: string;
  actor: string;
  role: string;
  action: string;
  entity: string;
  entityId: string;
  details: string;
}

export type ReportFormat = 'csv' | 'json' | 'pdf';

export interface GenerateReportRequest {
  type: 'appointments' | 'payments' | 'patients' | 'audit' | 'waitlist';
  format: ReportFormat;
  filters?: Record<string, unknown>;
  dateFrom?: string;
  dateTo?: string;
}

// ============================================
// ENVIRONMENT CONFIG
// ============================================

export interface ApiConfig {
  baseUrl: string;
  timeout: number; // milliseconds
  retryAttempts: number;
  retryDelay: number; // milliseconds
}

// Default config - overridden by environment
export const defaultApiConfig: ApiConfig = {
  baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1',
  timeout: 30000,
  retryAttempts: 3,
  retryDelay: 1000,
};
