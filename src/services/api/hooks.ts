// API Hooks - React hooks for data fetching with loading, error, retry states
// Provides consistent patterns for all server-backed screens

import { useState, useEffect, useCallback, useRef } from 'react';
import { ApiErrorClass } from './client';
import { useServices } from './index';

// ============================================
// TYPES
// ============================================

export interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: ApiErrorClass | null;
  retry: () => void;
  refresh: () => void;
}

export interface UseApiListState<T> {
  data: T[];
  meta: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  } | null;
  loading: boolean;
  error: ApiErrorClass | null;
  retry: () => void;
  refresh: () => void;
  loadMore: () => void;
  setParams: (params: Partial<{ page: number; pageSize: number; [key: string]: unknown }>) => void;
}

export interface UseMutationState<TData, TVariables> {
  data: TData | null;
  loading: boolean;
  error: ApiErrorClass | null;
  mutate: (variables: TVariables) => Promise<TData | null>;
  reset: () => void;
}

// ============================================
// GENERIC API HOOK
// ============================================

function useApi<T>(
  fetcher: () => Promise<T>,
  options: {
    immediate?: boolean;
    onSuccess?: (data: T) => void;
    onError?: (error: ApiErrorClass) => void;
  } = {}
): UseApiState<T> {
  const { immediate = true, onSuccess, onError } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiErrorClass | null>(null);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetcherRef.current();
      setData(result);
      onSuccess?.(result);
      return result;
    } catch (err) {
      const apiError =
        err instanceof ApiErrorClass
          ? err
          : new ApiErrorClass({
              code: 'UNKNOWN_ERROR',
              message: err instanceof Error ? err.message : 'Unknown error',
              statusCode: 0,
              timestamp: new Date().toISOString(),
            });
      setError(apiError);
      onError?.(apiError);
      throw apiError;
    } finally {
      setLoading(false);
    }
  }, [onSuccess, onError]);

  const retry = useCallback(() => execute(), [execute]);
  const refresh = useCallback(() => execute(), [execute]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  return { data, loading, error, retry, refresh };
}

// ============================================
// LIST HOOK WITH PAGINATION
// ============================================

interface ListFetcherParams {
  page?: number;
  pageSize?: number;
  sort?: { field?: string; direction?: 'asc' | 'desc' };
  [key: string]: unknown;
}

function useApiList<T>(
  fetcher: (params: ListFetcherParams) => Promise<{ data: T[]; meta: any }>,
  initialParams: ListFetcherParams = { page: 1, pageSize: 20 }
): UseApiListState<T> {
  const [params, setParamsState] = useState<ListFetcherParams>(initialParams);
  const [data, setData] = useState<T[]>([]);
  const [meta, setMeta] = useState<UseApiListState<T>['meta']>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiErrorClass | null>(null);
  const isMounted = useRef(true);

  const fetch = useCallback(
    async (p: ListFetcherParams, append = false) => {
      setLoading(true);
      setError(null);
      try {
        const result = await fetcher(p);
        if (!isMounted.current) return;

        if (append) {
          setData((prev) => [...prev, ...result.data]);
        } else {
          setData(result.data);
        }
        setMeta({
          page: result.meta.page,
          pageSize: result.meta.pageSize,
          totalItems: result.meta.totalItems,
          totalPages: result.meta.totalPages,
          hasNextPage: result.meta.hasNextPage,
          hasPreviousPage: result.meta.hasPreviousPage,
        });
      } catch (err) {
        if (!isMounted.current) return;
        const apiError =
          err instanceof ApiErrorClass
            ? err
            : new ApiErrorClass({
                code: 'UNKNOWN_ERROR',
                message: err instanceof Error ? err.message : 'Unknown error',
                statusCode: 0,
                timestamp: new Date().toISOString(),
              });
        setError(apiError);
      } finally {
        if (isMounted.current) setLoading(false);
      }
    },
    [fetcher]
  );

  const retry = useCallback(() => fetch(params), [fetch, params]);
  const refresh = useCallback(() => fetch({ ...params, page: 1 }), [fetch, params]);
  const loadMore = useCallback(() => {
    if (meta?.hasNextPage) {
      fetch({ ...params, page: params.page + 1 }, true);
    }
  }, [fetch, params, meta]);

  const setParams = useCallback((newParams: Partial<ListFetcherParams>) => {
    setParamsState((prev) => ({ ...prev, ...newParams, page: 1 }));
  }, []);

  useEffect(() => {
    fetch(params);
    return () => {
      isMounted.current = false;
    };
  }, [fetch, params]);

  return { data, meta, loading, error, retry, refresh, loadMore, setParams };
}

// ============================================
// MUTATION HOOK
// ============================================

function useMutation<TData, TVariables>(
  mutator: (variables: TVariables) => Promise<TData>,
  options: {
    onSuccess?: (data: TData) => void;
    onError?: (error: ApiErrorClass) => void;
  } = {}
): UseMutationState<TData, TVariables> {
  const { onSuccess, onError } = options;
  const [data, setData] = useState<TData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiErrorClass | null>(null);

  const mutate = useCallback(
    async (variables: TVariables) => {
      setLoading(true);
      setError(null);
      try {
        const result = await mutator(variables);
        setData(result);
        onSuccess?.(result);
        return result;
      } catch (err) {
        const apiError =
          err instanceof ApiErrorClass
            ? err
            : new ApiErrorClass({
                code: 'UNKNOWN_ERROR',
                message: err instanceof Error ? err.message : 'Unknown error',
                statusCode: 0,
                timestamp: new Date().toISOString(),
              });
        setError(apiError);
        onError?.(apiError);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [mutator, onSuccess, onError]
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { data, loading, error, mutate, reset };
}

// ============================================
// SPECIFIC HOOKS FOR EACH DOMAIN
// ============================================

// Appointment hooks
export function useAppointments(params?: {
  page?: number;
  pageSize?: number;
  sort?: { field?: string; direction?: 'asc' | 'desc' };
  [key: string]: unknown;
}) {
  return useApiList(
    useCallback((p) => useServices().appointments.getAll(p as any), []),
    params
  );
}

export function useAppointment(id: string) {
  return useApi(
    useCallback(() => useServices().appointments.getById(id), [id]),
    { immediate: !!id }
  );
}

export function useCreateAppointment() {
  return useMutation(useCallback((data: any) => useServices().appointments.create(data), []));
}

export function useUpdateAppointment() {
  return useMutation(
    useCallback(
      (vars: { id: string; data: any }) => useServices().appointments.update(vars.id, vars.data),
      []
    )
  );
}

export function useAppointmentActions() {
  const services = useServices();
  return {
    cancel: useCallback(
      (id: string, reason: string) => services.appointments.cancel(id, reason),
      [services]
    ),
    reschedule: useCallback(
      (id: string, newDate: string, newStartTime: string) =>
        services.appointments.reschedule(id, newDate, newStartTime),
      [services]
    ),
    markNoShow: useCallback(
      (id: string, reason: string) => services.appointments.markNoShow(id, reason),
      [services]
    ),
    createEmergency: useCallback(
      (data: any) => services.appointments.createEmergency(data),
      [services]
    ),
    getAvailableSlots: useCallback(
      (dentistId: string, date: string, duration: number) =>
        services.appointments.getAvailableSlots(dentistId, date, duration),
      [services]
    ),
    getAlternativeDates: useCallback(
      (dentistId: string, fromDate: string, duration: number, count?: number) =>
        services.appointments.getAlternativeDates(dentistId, fromDate, duration, count),
      [services]
    ),
  };
}

// Patient hooks
export function usePatients(params?: {
  page?: number;
  pageSize?: number;
  sort?: { field?: string; direction?: 'asc' | 'desc' };
  [key: string]: unknown;
}) {
  return useApiList(
    useCallback((p) => useServices().patients.getAll(p as any), []),
    params
  );
}

export function usePatient(id: string) {
  return useApi(
    useCallback(() => useServices().patients.getById(id), [id]),
    { immediate: !!id }
  );
}

export function useCreatePatient() {
  return useMutation(useCallback((data: any) => useServices().patients.create(data), []));
}

export function useUpdatePatient() {
  return useMutation(
    useCallback(
      (vars: { id: string; data: any }) => useServices().patients.update(vars.id, vars.data),
      []
    )
  );
}

// Dentist hooks
export function useDentists() {
  return useApi(
    useCallback(() => useServices().dentists.getAll(), []),
    { immediate: true }
  );
}

export function useDentist(id: string) {
  return useApi(
    useCallback(() => useServices().dentists.getById(id), [id]),
    { immediate: !!id }
  );
}

export function useDentistSchedules(dentistId: string) {
  return useApi(
    useCallback(() => useServices().dentists.getSchedules(dentistId), [dentistId]),
    { immediate: !!dentistId }
  );
}

// Service hooks
export function useDentalServices() {
  return useApi(
    useCallback(() => useServices().services.getAll(), []),
    { immediate: true }
  );
}

// Waitlist hooks
export function useWaitlist(params?: {
  page?: number;
  pageSize?: number;
  sort?: { field?: string; direction?: 'asc' | 'desc' };
  [key: string]: unknown;
}) {
  return useApiList(
    useCallback((p) => useServices().waitlist.getAll(p as any), []),
    params
  );
}

export function useJoinWaitlist() {
  return useMutation(useCallback((data: any) => useServices().waitlist.join(data), []));
}

export function useLeaveWaitlist() {
  return useMutation(useCallback((id: string) => useServices().waitlist.leave(id), []));
}

// Consultation hooks
export function useConsultations(params?: {
  page?: number;
  pageSize?: number;
  sort?: { field?: string; direction?: 'asc' | 'desc' };
  [key: string]: unknown;
}) {
  return useApiList(
    useCallback((p) => useServices().consultations.getAll(p as any), []),
    params
  );
}

export function useCreateConsultation() {
  return useMutation(useCallback((data: any) => useServices().consultations.create(data), []));
}

// Payment hooks
export function usePayments(params?: {
  page?: number;
  pageSize?: number;
  sort?: { field?: string; direction?: 'asc' | 'desc' };
  [key: string]: unknown;
}) {
  return useApiList(
    useCallback((p) => useServices().payments.getAll(p as any), []),
    params
  );
}

export function useCreatePayment() {
  return useMutation(useCallback((data: any) => useServices().payments.create(data), []));
}

export function useRevenueSummary(dateFrom: string, dateTo: string) {
  return useApi(
    useCallback(
      () => useServices().payments.getRevenueSummary(dateFrom, dateTo),
      [dateFrom, dateTo]
    ),
    { immediate: !!dateFrom && !!dateTo }
  );
}

// Notification hooks
export function useNotifications(params?: {
  page?: number;
  pageSize?: number;
  sort?: { field?: string; direction?: 'asc' | 'desc' };
  [key: string]: unknown;
}) {
  return useApiList(
    useCallback((p) => useServices().notifications.getAll(p as any), []),
    params
  );
}

// Settings hooks
export function useSettings() {
  return useApi(
    useCallback(() => useServices().settings.get(), []),
    { immediate: true }
  );
}

export function useUpdateSettings() {
  return useMutation(useCallback((data: any) => useServices().settings.update(data), []));
}

// Report hooks
export function useGenerateReport() {
  return useMutation(
    useCallback(
      (data: { type: string; format: string; filters?: Record<string, unknown> }) =>
        useServices().reports.generateReport(data.type as any, data.format as any, data.filters),
      []
    )
  );
}

export function useDownloadReport() {
  return useMutation(
    useCallback(
      (data: { type: string; format: string; filters?: Record<string, unknown> }) =>
        useServices().reports.downloadReport(data.type as any, data.format as any, data.filters),
      []
    )
  );
}

// ============================================
// EXPORTS
// ============================================

export { useApi, useApiList, useMutation };
