export type UserRole = 'patient' | 'front_desk' | 'dentist' | 'admin';

export interface User {
  id: string;
  role: UserRole;
  fullName: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  avatarUrl?: string;
}

export interface Patient {
  id: string;
  userId?: string;
  patientNumber: string;
  fullName: string;
  dateOfBirth: string;
  sex: 'Male' | 'Female' | 'Other';
  phone: string;
  email: string;
  address: string;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  identificationReference: string; // e.g. National ID or Insurance ID
  medicalAlerts: string[];
  allergies: string[];
  noShowCount: number;
  requiresStaffReviewForBooking?: boolean;
  createdAt: string;
  updatedAt: string;
}

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

export type ServiceCategory = 'General' | 'Restorative' | 'Orthodontics' | 'Endodontics' | 'Periodontics' | 'Cosmetic' | 'Surgery';

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

export interface DentistSchedule {
  id: string;
  dentistId: string;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  startTime: string; // "09:00"
  endTime: string;   // "17:00"
  breakStart: string; // "12:00"
  breakEnd: string;   // "13:00"
  active: boolean;
}

export interface BlockedSchedule {
  id: string;
  dentistId?: string; // empty means whole clinic
  date: string;       // "YYYY-MM-DD"
  startTime?: string;
  endTime?: string;
  reason: string;
  isAllDay: boolean;
}

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
  startTime: string; // "09:00"
  endTime: string;   // "09:45"
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
  createdAt: string;
  updatedAt: string;
  confirmedAt?: string;
  arrivedAt?: string;
  consultationStartedAt?: string;
  completedAt?: string;
  followUpReminderScheduledFor?: string;
  followUpReminderSentAt?: string;
}

export interface WaitlistEntry {
  id: string;
  patientId: string;
  preferredDentistId?: string;
  serviceId: string;
  preferredDate: string; // YYYY-MM-DD
  preferredTimeRange: 'morning' | 'afternoon' | 'any';
  priority: 'normal' | 'high' | 'urgent';
  status: 'active' | 'notified' | 'booked' | 'cancelled';
  notes?: string;
  createdAt: string;
  notifiedAt?: string;
  matchedAppointmentId?: string;
}

export interface PrescriptionItem {
  id: string;
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
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
  followUpRecommendation?: {
    required: boolean;
    timeframeWeeks: number;
    recommendedDate?: string;
    notes: string;
  };
  createdAt: string;
  updatedAt: string;
}

export type PaymentMethod = 'Cash' | 'Credit Card' | 'Debit Card' | 'Insurance' | 'Online Banking';
export type PaymentStatus = 'Pending' | 'Paid' | 'Partially-Paid' | 'Refunded';

export interface Payment {
  id: string;
  appointmentId: string;
  patientId: string;
  subtotal: number;
  discount: number;
  insuranceCoverage: number; // percentage or fixed amount
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
  amountPaid: number;
  balance: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  receiptNumber: string;
  notes?: string;
  createdAt: string;
}

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
  sentAt: string;
  relatedAppointmentId?: string;
  metadata?: Record<string, unknown>;
}

export interface AuditLog {
  id: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  entityType: 'appointment' | 'patient' | 'dentist' | 'service' | 'schedule' | 'payment' | 'consultation' | 'waitlist' | 'settings';
  entityId: string;
  beforeValue?: string;
  afterValue?: string;
  details?: string;
  timestamp: string;
}

export interface SystemSettings {
  clinicName: string;
  clinicPhone: string;
  clinicEmail: string;
  clinicAddress: string;
  clinicOpenTime: string;  // "08:00"
  clinicCloseTime: string; // "18:00"
  defaultSlotDurationMinutes: number; // 30
  bufferTimeMinutes: number; // 10
  pendingHoldMinutes: number; // 15
  maxNoShowsBeforeLock: number; // 2
  requireStaffReviewOnNoShow: boolean;
  reminderLeadHours: number; // 24
  autoNotifyWaitlistOnCancel: boolean;
  emergencyBufferShiftMinutes: number; // 20
}
