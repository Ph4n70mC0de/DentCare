// API Client - Centralized HTTP client with interceptors, retry logic, error handling
// Uses fetch API with TypeScript types

import {
  defaultApiConfig,
} from './types';

import type {
  ApiConfig,
  ApiError as ApiErrorType,
  ApiErrorResponse,
  LoginRequest,
  LoginResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  UserProfile,
  RegisterPatientRequest,
  RegisterPatientResponse,
  Appointment,
  CreateAppointmentRequest,
  UpdateAppointmentRequest,
  RescheduleAppointmentRequest,
  AppointmentListParams,
  AvailableSlot,
  AlternativeDate,
  Patient,
  PatientListParams,
  UpdatePatientRequest,
  Dentist,
  DentistSchedule,
  CreateDentistScheduleRequest,
  BlockedSchedule,
  CreateBlockedScheduleRequest,
  DentalService,
  CreateServiceRequest,
  UpdateServiceRequest,
  WaitlistEntry,
  CreateWaitlistEntryRequest,
  WaitlistListParams,
  Consultation,
  CreateConsultationRequest,
  ConsultationListParams,
  Payment,
  CreatePaymentRequest,
  PaymentListParams,
  RevenueSummary,
  AppNotification,
  NotificationListParams,
  MarkNotificationsReadRequest,
  AuditLog,
  AuditListParams,
  SystemSettings,
  UpdateSettingsRequest,
  GenerateReportRequest,
  PaginatedResponse,
  HealthCheckResponse,
} from './types';

// ============================================
// TOKEN MANAGEMENT
// ============================================

const TOKEN_STORAGE_KEY = 'dentcare_access_token';
const REFRESH_TOKEN_STORAGE_KEY = 'dentcare_refresh_token';
const TOKEN_EXPIRY_KEY = 'dentcare_token_expiry';

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
}

export function setTokens(accessToken: string, refreshToken: string, expiresIn: number): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_STORAGE_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, refreshToken);
  const expiry = Date.now() + expiresIn * 1000;
  localStorage.setItem(TOKEN_EXPIRY_KEY, String(expiry));
}

export function clearTokens(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
  localStorage.removeItem(TOKEN_EXPIRY_KEY);
}

export function isTokenExpired(): boolean {
  if (typeof window === 'undefined') return true;
  const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
  if (!expiry) return true;
  return Date.now() >= parseInt(expiry, 10);
}

// ============================================
// ERROR HANDLING
// ============================================

export class ApiErrorClass extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: Record<string, unknown>;
  public readonly timestamp: string;
  public readonly requestId?: string;

  constructor(response: ApiErrorResponse) {
    super(response.message);
    this.name = 'ApiError';
    this.code = response.code;
    this.statusCode = response.statusCode;
    this.details = response.details;
    this.timestamp = response.timestamp;
    this.requestId = response.requestId;
  }
}

export function parseApiError(response: Response, data: unknown): ApiErrorClass {
  const errorData = data as ApiErrorResponse;
  return new ApiErrorClass({
    code: errorData.code || 'UNKNOWN_ERROR',
    message: errorData.message || 'An unexpected error occurred',
    statusCode: response.status,
    details: errorData.details,
    timestamp: errorData.timestamp || new Date().toISOString(),
    requestId: errorData.requestId,
  });
}

// ============================================
// REQUEST/RESPONSE INTERCEPTORS
// ============================================

type RequestInterceptor = (config: RequestInit) => RequestInit | Promise<RequestInit>;
type ResponseInterceptor = (response: Response) => Response | Promise<Response>;
type ErrorInterceptor = (error: ApiErrorClass) => void | Promise<void> | Promise<never>;

class InterceptorManager {
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];
  private errorInterceptors: ErrorInterceptor[] = [];

  addRequestInterceptor(interceptor: RequestInterceptor): () => void {
    this.requestInterceptors.push(interceptor);
    return () => {
      const index = this.requestInterceptors.indexOf(interceptor);
      if (index > -1) this.requestInterceptors.splice(index, 1);
    };
  }

  addResponseInterceptor(interceptor: ResponseInterceptor): () => void {
    this.responseInterceptors.push(interceptor);
    return () => {
      const index = this.responseInterceptors.indexOf(interceptor);
      if (index > -1) this.responseInterceptors.splice(index, 1);
    };
  }

  addErrorInterceptor(interceptor: ErrorInterceptor): () => void {
    this.errorInterceptors.push(interceptor);
    return () => {
      const index = this.errorInterceptors.indexOf(interceptor);
      if (index > -1) this.errorInterceptors.splice(index, 1);
    };
  }

  async runRequestInterceptors(config: RequestInit): Promise<RequestInit> {
    let result = config;
    for (const interceptor of this.requestInterceptors) {
      result = await interceptor(result);
    }
    return result;
  }

  async runResponseInterceptors(response: Response): Promise<Response> {
    let result = response;
    for (const interceptor of this.responseInterceptors) {
      result = await interceptor(result);
    }
    return result;
  }

  async runErrorInterceptors(error: ApiErrorClass): Promise<never> {
    for (const interceptor of this.errorInterceptors) {
      await interceptor(error);
    }
    throw error;
  }
}

// ============================================
// RETRY LOGIC
// ============================================

interface RetryOptions {
  attempts: number;
  delay: number;
  shouldRetry?: (error: ApiErrorClass) => boolean;
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry(
  fetchFn: () => Promise<Response>,
  options: RetryOptions
): Promise<Response> {
  let lastError: ApiErrorClass | null = null;

  for (let attempt = 0; attempt <= options.attempts; attempt++) {
    try {
      const response = await fetchFn();
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        lastError = parseApiError(response, errorData);

        // Don't retry on client errors (4xx) except 429
        if (response.status >= 400 && response.status < 500 && response.status !== 429) {
          throw lastError;
        }

        // Check custom shouldRetry
        if (options.shouldRetry && !options.shouldRetry(lastError)) {
          throw lastError;
        }
      } else {
        return response;
      }
    } catch (error) {
      if (error instanceof ApiErrorClass) {
        lastError = error;
        // Don't retry on client errors
        if (error.statusCode >= 400 && error.statusCode < 500 && error.statusCode !== 429) {
          throw error;
        }
      } else {
        // Network error or other
        lastError = new ApiErrorClass({
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : 'Network request failed',
          statusCode: 0,
          timestamp: new Date().toISOString(),
        });
      }
    }

    // If this was the last attempt, throw
    if (attempt === options.attempts) break;

    // Wait before retry with exponential backoff
    const delay = options.delay * Math.pow(2, attempt);
    await sleep(delay);
  }

  throw lastError || new ApiErrorClass({
    code: 'MAX_RETRIES_EXCEEDED',
    message: 'Maximum retry attempts exceeded',
    statusCode: 0,
    timestamp: new Date().toISOString(),
  });
}

// ============================================
// API CLIENT CLASS
// ============================================

export class ApiClient {
  private config: ApiConfig;
  private interceptors: InterceptorManager;
  private baseHeaders: Record<string, string>;

  constructor(config: Partial<ApiConfig> = {}) {
    this.config = { ...defaultApiConfig, ...config };
    this.interceptors = new InterceptorManager();
    this.baseHeaders = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    // Default request interceptor - adds auth header
    this.interceptors.addRequestInterceptor(async (config) => {
      const token = getAccessToken();
      const headers = new Headers(config.headers);
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return { ...config, headers };
    });

    // Default response interceptor - handles token refresh on 401
    this.interceptors.addResponseInterceptor(async (response) => {
      if (response.status === 401 && !response.url.includes('/auth/refresh')) {
        const refreshed = await this.refreshAccessToken();
        if (refreshed) {
          // Retry original request with new token
          const token = getAccessToken();
          const retryConfig: RequestInit = {
            ...response,
            headers: {
              ...Object.fromEntries(response.headers.entries()),
              Authorization: `Bearer ${token}`,
            },
          };
          return fetch(response.url, retryConfig);
        } else {
          // Refresh failed - redirect to login
          clearTokens();
          if (typeof window !== 'undefined') {
            window.location.href = '/login?expired=1';
          }
        }
      }
      return response;
    });

    // Error interceptor for logging
    this.interceptors.addErrorInterceptor(async (error) => {
      console.error('[API Error]', {
        code: error.code,
        message: error.message,
        statusCode: error.statusCode,
        timestamp: error.timestamp,
        requestId: error.requestId,
      });
    });
  }

  // Public methods to add custom interceptors
  addRequestInterceptor(interceptor: RequestInterceptor) {
    return this.interceptors.addRequestInterceptor(interceptor);
  }

  addResponseInterceptor(interceptor: ResponseInterceptor) {
    return this.interceptors.addResponseInterceptor(interceptor);
  }

  addErrorInterceptor(interceptor: ErrorInterceptor) {
    return this.interceptors.addErrorInterceptor(interceptor);
  }

  // Token refresh
  private async refreshAccessToken(): Promise<boolean> {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return false;

    try {
      const response = await fetch(`${this.config.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: this.baseHeaders,
        body: JSON.stringify({ refreshToken } as RefreshTokenRequest),
      });

      if (response.ok) {
        const data = await response.json() as RefreshTokenResponse;
        setTokens(data.accessToken, refreshToken, data.expiresIn);
        return true;
      }
    } catch {
      // Ignore - will be handled by returning false
    }
    return false;
  }

  // Core request method
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retryOptions?: Partial<RetryOptions>
  ): Promise<T> {
    const url = `${this.config.baseUrl}${endpoint}`;
    const requestConfig = await this.interceptors.runRequestInterceptors({
      ...options,
      headers: {
        ...this.baseHeaders,
        ...options.headers,
      },
    });

    const response = await fetchWithRetry(
      () => fetch(url, requestConfig),
      {
        attempts: retryOptions?.attempts ?? this.config.retryAttempts,
        delay: retryOptions?.delay ?? this.config.retryDelay,
        shouldRetry: retryOptions?.shouldRetry,
      }
    );

    const processedResponse = await this.interceptors.runResponseInterceptors(response);

    if (!processedResponse.ok) {
      const errorData = await processedResponse.json().catch(() => ({}));
      await this.interceptors.runErrorInterceptors(parseApiError(processedResponse, errorData));
    }

    // Handle 204 No Content
    if (processedResponse.status === 204) {
      return undefined as T;
    }

    return processedResponse.json() as Promise<T>;
  }

  // HTTP methods
  get<T>(endpoint: string, params?: Record<string, unknown>): Promise<T> {
    const queryString = params
      ? '?' + new URLSearchParams(params as Record<string, string>).toString()
      : '';
    return this.request<T>(`${endpoint}${queryString}`, { method: 'GET' });
  }

  post<T>(endpoint: string, body: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  put<T>(endpoint: string, body: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  patch<T>(endpoint: string, body: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // Health check
  async healthCheck(): Promise<HealthCheckResponse> {
    return this.get<HealthCheckResponse>('/health');
  }

  // Auth methods
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await this.post<LoginResponse>('/auth/login', credentials);
    setTokens(response.accessToken, response.refreshToken, response.expiresIn);
    return response;
  }

  async logout(): Promise<void> {
    try {
      await this.post<void>('/auth/logout', {});
    } finally {
      clearTokens();
    }
  }

  async getProfile(): Promise<UserProfile> {
    return this.get<UserProfile>('/auth/profile');
  }

  async registerPatient(data: RegisterPatientRequest): Promise<RegisterPatientResponse> {
    return this.post<RegisterPatientResponse>('/patients/register', data);
  }

  // Appointment methods
  async getAppointments(params?: AppointmentListParams): Promise<PaginatedResponse<Appointment>> {
    return this.get<PaginatedResponse<Appointment>>('/appointments', params as Record<string, unknown>);
  }

  async getAppointment(id: string): Promise<Appointment> {
    return this.get<Appointment>(`/appointments/${id}`);
  }

  async createAppointment(data: CreateAppointmentRequest): Promise<Appointment> {
    return this.post<Appointment>('/appointments', data);
  }

  async updateAppointment(id: string, data: UpdateAppointmentRequest): Promise<Appointment> {
    return this.patch<Appointment>(`/appointments/${id}`, data);
  }

  async cancelAppointment(id: string, reason: string): Promise<Appointment> {
    return this.post<Appointment>(`/appointments/${id}/cancel`, { reason });
  }

  async rescheduleAppointment(id: string, data: RescheduleAppointmentRequest): Promise<Appointment> {
    return this.post<Appointment>(`/appointments/${id}/reschedule`, data);
  }

  async markNoShow(id: string, reason: string): Promise<Appointment> {
    return this.post<Appointment>(`/appointments/${id}/no-show`, { reason });
  }

  async createEmergencyAppointment(data: CreateAppointmentRequest & { emergencyNotes: string; severity: 'high' | 'critical' }): Promise<Appointment> {
    return this.post<Appointment>('/appointments/emergency', data);
  }

  async getAvailableSlots(dentistId: string, date: string, durationMinutes: number): Promise<AvailableSlot[]> {
    return this.get<AvailableSlot[]>(`/appointments/available-slots`, {
      dentistId,
      date,
      durationMinutes,
    });
  }

  async getAlternativeDates(dentistId: string, fromDate: string, durationMinutes: number, count?: number): Promise<AlternativeDate[]> {
    return this.get<AlternativeDate[]>(`/appointments/alternative-dates`, {
      dentistId,
      fromDate,
      durationMinutes,
      count,
    });
  }

  // Patient methods
  async getPatients(params?: PatientListParams): Promise<PaginatedResponse<Patient>> {
    return this.get<PaginatedResponse<Patient>>('/patients', params as Record<string, unknown>);
  }

  async getPatient(id: string): Promise<Patient> {
    return this.get<Patient>(`/patients/${id}`);
  }

  async findPatient(identifier: string): Promise<Patient | null> {
    try {
      return await this.get<Patient>(`/patients/find`, { identifier });
    } catch (error) {
      if (error instanceof ApiErrorClass && error.statusCode === 404) return null;
      throw error;
    }
  }

  async updatePatient(id: string, data: UpdatePatientRequest): Promise<Patient> {
    return this.patch<Patient>(`/patients/${id}`, data);
  }

  async confirmBookingEligibility(patientId: string): Promise<Patient> {
    return this.post<Patient>(`/patients/${patientId}/confirm-eligibility`, {});
  }

  // Dentist methods
  async getDentists(): Promise<Dentist[]> {
    return this.get<Dentist[]>('/dentists');
  }

  async getDentist(id: string): Promise<Dentist> {
    return this.get<Dentist>(`/dentists/${id}`);
  }

  async getDentistSchedules(dentistId: string): Promise<DentistSchedule[]> {
    return this.get<DentistSchedule[]>(`/dentists/${dentistId}/schedules`);
  }

  async createDentistSchedule(data: CreateDentistScheduleRequest): Promise<DentistSchedule> {
    return this.post<DentistSchedule>('/dentists/schedules', data);
  }

  async updateDentistSchedule(id: string, data: Partial<CreateDentistScheduleRequest>): Promise<DentistSchedule> {
    return this.patch<DentistSchedule>(`/dentists/schedules/${id}`, data);
  }

  async deleteDentistSchedule(id: string): Promise<void> {
    return this.delete<void>(`/dentists/schedules/${id}`);
  }

  // Blocked schedules
  async getBlockedSchedules(): Promise<BlockedSchedule[]> {
    return this.get<BlockedSchedule[]>('/blocked-schedules');
  }

  async createBlockedSchedule(data: CreateBlockedScheduleRequest): Promise<BlockedSchedule> {
    return this.post<BlockedSchedule>('/blocked-schedules', data);
  }

  async deleteBlockedSchedule(id: string): Promise<void> {
    return this.delete<void>(`/blocked-schedules/${id}`);
  }

  // Service methods
  async getServices(): Promise<DentalService[]> {
    return this.get<DentalService[]>('/services');
  }

  async getService(id: string): Promise<DentalService> {
    return this.get<DentalService>(`/services/${id}`);
  }

  async createService(data: CreateServiceRequest): Promise<DentalService> {
    return this.post<DentalService>('/services', data);
  }

  async updateService(id: string, data: UpdateServiceRequest): Promise<DentalService> {
    return this.patch<DentalService>(`/services/${id}`, data);
  }

  async deleteService(id: string): Promise<void> {
    return this.delete<void>(`/services/${id}`);
  }

  // Waitlist methods
  async getWaitlist(params?: WaitlistListParams): Promise<PaginatedResponse<WaitlistEntry>> {
    return this.get<PaginatedResponse<WaitlistEntry>>('/waitlist', params as Record<string, unknown>);
  }

  async joinWaitlist(data: CreateWaitlistEntryRequest): Promise<WaitlistEntry> {
    return this.post<WaitlistEntry>('/waitlist', data);
  }

  async leaveWaitlist(id: string): Promise<void> {
    return this.delete<void>(`/waitlist/${id}`);
  }

  // Consultation methods
  async getConsultations(params?: ConsultationListParams): Promise<PaginatedResponse<Consultation>> {
    return this.get<PaginatedResponse<Consultation>>('/consultations', params as Record<string, unknown>);
  }

  async getConsultation(id: string): Promise<Consultation> {
    return this.get<Consultation>(`/consultations/${id}`);
  }

  async createConsultation(data: CreateConsultationRequest): Promise<Consultation> {
    return this.post<Consultation>('/consultations', data);
  }

  // Payment methods
  async getPayments(params?: PaymentListParams): Promise<PaginatedResponse<Payment>> {
    return this.get<PaginatedResponse<Payment>>('/payments', params as Record<string, unknown>);
  }

  async getPayment(id: string): Promise<Payment> {
    return this.get<Payment>(`/payments/${id}`);
  }

  async createPayment(data: CreatePaymentRequest): Promise<Payment> {
    return this.post<Payment>('/payments', data);
  }

  async getRevenueSummary(dateFrom: string, dateTo: string): Promise<RevenueSummary> {
    return this.get<RevenueSummary>('/payments/revenue-summary', { dateFrom, dateTo });
  }

  // Notification methods
  async getNotifications(params?: NotificationListParams): Promise<PaginatedResponse<AppNotification>> {
    return this.get<PaginatedResponse<AppNotification>>('/notifications', params as Record<string, unknown>);
  }

  async markNotificationsRead(data: MarkNotificationsReadRequest): Promise<void> {
    return this.post<void>('/notifications/read', data);
  }

  // Audit methods
  async getAuditLogs(params?: AuditListParams): Promise<PaginatedResponse<AuditLog>> {
    return this.get<PaginatedResponse<AuditLog>>('/audit-logs', params as Record<string, unknown>);
  }

  // Settings methods
  async getSettings(): Promise<SystemSettings> {
    return this.get<SystemSettings>('/settings');
  }

  async updateSettings(data: UpdateSettingsRequest): Promise<SystemSettings> {
    return this.patch<SystemSettings>('/settings', data);
  }

  // Report methods
  async generateReport(data: GenerateReportRequest): Promise<Blob> {
    const response = await fetch(`${this.config.baseUrl}/reports/generate`, {
      method: 'POST',
      headers: {
        ...this.baseHeaders,
        Authorization: `Bearer ${getAccessToken()}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw parseApiError(response, errorData);
    }

    return response.blob();
  }

  async downloadReport(data: GenerateReportRequest): Promise<void> {
    const blob = await this.generateReport(data);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-${data.type}-${new Date().toISOString().split('T')[0]}.${data.format}`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

export const apiClient = new ApiClient();

// Export class for testing
export { ApiClient as ApiClientClass };