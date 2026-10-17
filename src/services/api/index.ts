// Services Index - Main entry point for all data services
// Automatically selects local or API implementation based on environment

import type { Services, ServiceMode } from './interfaces';
import { createLocalServices } from './localImplementation';
import { createApiServices } from './apiImplementation';
import { getServiceMode, isLocalMode, isApiMode } from './interfaces';

// ============================================
// SERVICE INSTANCE (Singleton)
// ============================================

let servicesInstance: Services | null = null;
let currentMode: ServiceMode | null = null;

export function getServices(): Services {
  const mode = getServiceMode();

  // Recreate if mode changed
  if (!servicesInstance || currentMode !== mode) {
    currentMode = mode;
    servicesInstance = mode === 'local' ? createLocalServices() : createApiServices();
    console.log(`[Services] Initialized in ${mode} mode`);
  }

  return servicesInstance;
}

export function resetServices(): void {
  servicesInstance = null;
  currentMode = null;
}

// For testing - allow manual mode override
export function setServicesMode(mode: ServiceMode): void {
  currentMode = mode;
  servicesInstance = mode === 'local' ? createLocalServices() : createApiServices();
}

// Export types and implementations
export * from './types';
export * from './interfaces';
export * from './client';
export * from './localImplementation';
export * from './apiImplementation';

// ============================================
// CONVENIENCE EXPORTS
// ============================================

// Re-export commonly used types
export type {
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

export type {
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
  MarkNotificationsReadRequest,
  UpdateSettingsRequest,
  RevenueSummary,
} from './types';

export type {
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
// HOOK FOR REACT COMPONENTS
// ============================================

/**
 * Hook to access services in React components
 * Usage:
 *   const { appointments, patients } = useServices();
 *   const data = await appointments.getAll({ page: 1, pageSize: 20 });
 */
export function useServices(): Services {
  return getServices();
}

/**
 * Hook to access a specific service
 * Usage:
 *   const appointments = useAppointmentService();
 *   const data = await appointments.getAll({ page: 1 });
 */
export function useAppointmentService() {
  return getServices().appointments;
}

export function usePatientService() {
  return getServices().patients;
}

export function useDentistService() {
  return getServices().dentists;
}

export function useAuthService() {
  return getServices().auth;
}

export function useWaitlistService() {
  return getServices().waitlist;
}

export function useConsultationService() {
  return getServices().consultations;
}

export function usePaymentService() {
  return getServices().payments;
}

export function useNotificationService() {
  return getServices().notifications;
}

export function useSettingsService() {
  return getServices().settings;
}
