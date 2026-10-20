// API State Components - Wrapper components for loading, error, empty, success states
// Uses the existing StateComponents and integrates with API hooks

import React, { useState } from 'react';
import {
  EmptyState,
  SuccessState,
  ValidationError,
  ServerError,
  InfoState,
  Skeleton,
} from '../../components/common/StateComponents';
import { NeoButton } from '../../components/common/NeoButton';
import { RefreshCw } from 'lucide-react';

// ============================================
// LOADING WRAPPER
// ============================================

interface WithLoadingProps<T> {
  loading: boolean;
  data: T | null;
  error: Error | null;
  retry?: () => void;
  emptyMessage?: string;
  emptyAction?: React.ReactNode;
  skeletonCount?: number;
  skeletonVariant?: 'text' | 'card' | 'table-row' | 'avatar' | 'button';
  children: (data: T) => React.ReactNode;
}

export function WithLoading<T>({
  loading,
  data,
  error,
  retry,
  emptyMessage = 'No data available',
  emptyAction,
  skeletonCount = 3,
  skeletonVariant = 'card',
  children,
}: WithLoadingProps<T>) {
  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton count={skeletonCount} variant={skeletonVariant} />
      </div>
    );
  }

  if (error) {
    return (
      <ServerError
        message={error.message}
        statusCode={
          error instanceof Error && 'statusCode' in error ? (error as any).statusCode : undefined
        }
        onRetry={retry}
        retryLabel="Try Again"
      />
    );
  }

  if (!data) {
    return <EmptyState title="No Data" message={emptyMessage} action={emptyAction} />;
  }

  return <>{children(data)}</>;
}

// ============================================
// WITH LOADING FOR LISTS
// ============================================

interface WithListLoadingProps<T> {
  loading: boolean;
  data: T[];
  meta: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  } | null;
  error: Error | null;
  retry?: () => void;
  loadMore?: () => void;
  hasMore?: boolean;
  emptyMessage?: string;
  emptyAction?: React.ReactNode;
  skeletonCount?: number;
  skeletonVariant?: 'text' | 'card' | 'table-row' | 'avatar' | 'button';
  renderItem: (item: T, index: number) => React.ReactNode;
  renderLoadMore?: () => React.ReactNode;
}

export function WithListLoading<T>({
  loading,
  data,
  meta,
  error,
  retry,
  loadMore,
  hasMore,
  emptyMessage = 'No items found',
  emptyAction,
  skeletonCount = 5,
  skeletonVariant = 'card',
  renderItem,
  renderLoadMore,
}: WithListLoadingProps<T>) {
  if (loading && data.length === 0) {
    return (
      <div className="space-y-4">
        <Skeleton count={skeletonCount} variant={skeletonVariant} />
      </div>
    );
  }

  if (error) {
    return (
      <ServerError
        message={error.message}
        statusCode={
          error instanceof Error && 'statusCode' in error ? (error as any).statusCode : undefined
        }
        onRetry={retry}
        retryLabel="Try Again"
      />
    );
  }

  if (data.length === 0) {
    return <EmptyState title="No Items" message={emptyMessage} action={emptyAction} />;
  }

  return (
    <div className="space-y-4">
      {data.map((item, index) => renderItem(item, index))}
      {(hasMore || meta?.hasNextPage) && (
        <div className="flex justify-center pt-4">
          {renderLoadMore ? (
            renderLoadMore()
          ) : (
            <NeoButton
              variant="default"
              onClick={loadMore}
              disabled={loading}
              icon={loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : undefined}
            >
              {loading ? 'Loading...' : 'Load More'}
            </NeoButton>
          )}
        </div>
      )}
      {meta && meta.totalItems > 0 && (
        <p className="text-center text-sm text-slate-500">
          Showing {data.length} of {meta.totalItems} items
        </p>
      )}
    </div>
  );
}

// ============================================
// FORM SUBMISSION WRAPPER
// ============================================

interface WithFormSubmitProps<TData, TVariables> {
  loading: boolean;
  error: Error | null;
  onSubmit: (variables: TVariables) => Promise<TData | null>;
  children: (
    submit: (variables: TVariables) => Promise<TData | null>,
    reset: () => void
  ) => React.ReactNode;
  onSuccess?: (data: TData) => void;
  onError?: (error: Error) => void;
}

export function WithFormSubmit<TData, TVariables>({
  loading,
  error,
  onSubmit,
  children,
  onSuccess,
  onError,
}: WithFormSubmitProps<TData, TVariables>) {
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<Error | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (variables: TVariables) => {
    setSubmitLoading(true);
    setSubmitError(null);
    setSuccessMessage(null);

    try {
      const result = await onSubmit(variables);
      if (result) {
        setSuccessMessage('Saved successfully');
        onSuccess?.(result);
      }
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Submission failed');
      setSubmitError(error);
      onError?.(error);
      return null;
    } finally {
      setSubmitLoading(false);
    }
  };

  const reset = () => {
    setSubmitError(null);
    setSuccessMessage(null);
  };

  const displayError = submitError || error;

  return (
    <>
      {successMessage && (
        <SuccessState
          title="Success"
          message={successMessage}
          action={
            <NeoButton variant="default" size="sm" onClick={() => setSuccessMessage(null)}>
              Dismiss
            </NeoButton>
          }
        />
      )}
      {displayError && <ValidationError errors={displayError.message} title="Submission Error" />}
      {children(handleSubmit, reset)}
    </>
  );
}

// ============================================
// RETRY BUTTON COMPONENT
// ============================================

interface RetryButtonProps {
  onRetry: () => void;
  loading?: boolean;
  label?: string;
  variant?: 'default' | 'primary' | 'danger' | 'success' | 'inset';
  size?: 'sm' | 'md' | 'lg';
}

export function RetryButton({
  onRetry,
  loading = false,
  label = 'Retry',
  variant = 'primary',
  size = 'md',
}: RetryButtonProps) {
  return (
    <NeoButton
      variant={variant}
      size={size}
      onClick={onRetry}
      disabled={loading}
      icon={
        loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />
      }
    >
      {label}
    </NeoButton>
  );
}

// ============================================
// OFFLINE INDICATOR
// ============================================

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useState(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  });

  if (isOnline) return null;

  return (
    <InfoState
      title="You're offline"
      message="Changes will be saved locally and synced when connection is restored."
      action={
        <RetryButton onRetry={() => window.location.reload()} variant="default" label="Reload" />
      }
    />
  );
}

// ============================================
// ERROR BOUNDARY FOR API ERRORS
// ============================================

interface ApiErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error) => void;
  resetKeys?: unknown[];
}

interface ApiErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ApiErrorBoundary extends React.Component<
  ApiErrorBoundaryProps,
  ApiErrorBoundaryState
> {
  constructor(props: ApiErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ApiErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('[API Error Boundary]', error, errorInfo);
    this.props.onError?.(error);
  }

  componentDidUpdate(prevProps: ApiErrorBoundaryProps): void {
    if (this.state.hasError && this.props.resetKeys) {
      const hasResetKeyChanged = this.props.resetKeys.some(
        (key, index) => key !== prevProps.resetKeys?.[index]
      );
      if (hasResetKeyChanged) {
        this.setState({ hasError: false, error: null });
      }
    }
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ServerError
          message={this.state.error?.message || 'Something went wrong'}
          onRetry={this.handleRetry}
          retryLabel="Try Again"
        />
      );
    }

    return this.props.children;
  }
}

// ============================================
// EXPORTS
// ============================================

export {
  LoadingState,
  EmptyState,
  SuccessState,
  ValidationError,
  ServerError,
  InfoState,
  Skeleton,
} from '../../components/common/StateComponents';
