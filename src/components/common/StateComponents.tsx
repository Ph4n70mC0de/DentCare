import React from 'react';
import { Loader2, CheckCircle2, AlertCircle, XCircle, Info, Search, Inbox, FileText, User, Calendar, CreditCard, ShieldCheck, Clock, RefreshCw } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading...',
  size = 'md',
  fullScreen = false,
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
  };

  const containerClasses = fullScreen
    ? 'fixed inset-0 z-50 flex items-center justify-center bg-slate-50/80 backdrop-blur-sm'
    : 'flex flex-col items-center justify-center';

  return (
    <div className={containerClasses}>
      <div className={fullScreen ? 'neo-raised-lg p-8 rounded-3xl max-w-sm w-full mx-4 text-center space-y-4' : 'space-y-3'}>
        <Loader2
          className={`${sizeClasses[size]} text-blue-600 animate-spin mx-auto`}
          aria-hidden="true"
        />
        <p className="text-sm font-medium text-slate-700">{message}</p>
      </div>
    </div>
  );
};

interface EmptyStateProps {
  title: string;
  message?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  variant?: 'default' | 'search' | 'inbox' | 'calendar' | 'patient' | 'payment';
}

const variantIcons: Record<EmptyStateProps['variant'], React.ReactNode> = {
  default: <Inbox className="w-12 h-12 text-slate-300" />,
  search: <Search className="w-12 h-12 text-slate-300" />,
  inbox: <Inbox className="w-12 h-12 text-slate-300" />,
  calendar: <Calendar className="w-12 h-12 text-slate-300" />,
  patient: <User className="w-12 h-12 text-slate-300" />,
  payment: <CreditCard className="w-12 h-12 text-slate-300" />,
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  message,
  icon,
  action,
  variant = 'default',
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center space-y-4">
      <div className="w-16 h-16 rounded-2xl neo-raised flex items-center justify-center bg-slate-100">
        {icon || variantIcons[variant] || variantIcons.default}
      </div>
      <div className="space-y-1 max-w-sm">
        <h3 className="text-lg font-bold text-slate-800">{title}</h3>
        {message && <p className="text-sm text-slate-500">{message}</p>}
      </div>
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
};

interface SuccessStateProps {
  title: string;
  message?: string;
  details?: React.ReactNode;
  action?: React.ReactNode;
}

export const SuccessState: React.FC<SuccessStateProps> = ({
  title,
  message,
  details,
  action,
}) => {
  return (
    <div className="neo-raised p-6 rounded-3xl bg-emerald-50/50 border border-emerald-200 space-y-4">
      <div className="flex items-center justify-center gap-3">
        <div className="w-12 h-12 rounded-2xl neo-raised flex items-center justify-center bg-emerald-100 text-emerald-600">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-emerald-900">{title}</h3>
          {message && <p className="text-sm text-emerald-700">{message}</p>}
        </div>
      </div>
      {details && (
        <div className="p-4 rounded-xl neo-inset bg-white/50 text-sm text-slate-700">
          {details}
        </div>
      )}
      {action && <div className="flex justify-center pt-2">{action}</div>}
    </div>
  );
};

interface ValidationErrorProps {
  errors: Record<string, string> | string[] | string;
  title?: string;
}

export const ValidationError: React.FC<ValidationErrorProps> = ({ errors, title = 'Please fix the following errors:' }) => {
  const errorList = Array.isArray(errors)
    ? errors
    : typeof errors === 'string'
    ? [errors]
    : Object.entries(errors).map(([field, message]) => `${field}: ${message}`);

  return (
    <div className="neo-raised p-4 rounded-2xl bg-rose-50/50 border border-rose-200 space-y-3" role="alert">
      <div className="flex items-center gap-2 text-rose-800">
        <AlertCircle className="w-5 h-5 shrink-0" />
        <h4 className="font-bold text-sm">{title}</h4>
      </div>
      <ul className="space-y-1.5 pl-7">
        {errorList.map((error, index) => (
          <li key={index} className="text-sm text-rose-700 flex items-center gap-2">
            <XCircle className="w-3.5 h-3.5 shrink-0" />
            {error}
          </li>
        ))}
      </ul>
    </div>
  );
};

interface ServerErrorProps {
  message: string;
  statusCode?: number;
  onRetry?: () => void;
  retryLabel?: string;
}

export const ServerError: React.FC<ServerErrorProps> = ({
  message,
  statusCode,
  onRetry,
  retryLabel = 'Try Again',
}) => {
  const getStatusMessage = (code?: number) => {
    switch (code) {
      case 400: return 'Bad Request';
      case 401: return 'Unauthorized';
      case 403: return 'Forbidden';
      case 404: return 'Not Found';
      case 409: return 'Conflict';
      case 422: return 'Unprocessable Entity';
      case 429: return 'Too Many Requests';
      case 500: return 'Internal Server Error';
      case 502: return 'Bad Gateway';
      case 503: return 'Service Unavailable';
      default: return 'Server Error';
    }
  };

  return (
    <div className="neo-raised p-6 rounded-3xl bg-rose-50/50 border border-rose-200 space-y-4 text-center" role="alert">
      <div className="w-12 h-12 rounded-2xl neo-raised mx-auto flex items-center justify-center bg-rose-100 text-rose-600">
        <AlertCircle className="w-6 h-6" />
      </div>
      <div className="space-y-1">
        <h3 className="text-lg font-bold text-rose-900">
          {statusCode ? `${statusCode} ${getStatusMessage(statusCode)}` : 'Server Error'}
        </h3>
        <p className="text-sm text-rose-700">{message}</p>
      </div>
      {onRetry && (
        <div className="pt-2">
          <button
            onClick={onRetry}
            className="neo-btn-primary inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-2xl gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            {retryLabel}
          </button>
        </div>
      )}
    </div>
  );
};

interface InfoStateProps {
  title: string;
  message?: string;
  action?: React.ReactNode;
}

export const InfoState: React.FC<InfoStateProps> = ({ title, message, action }) => {
  return (
    <div className="neo-raised p-6 rounded-3xl bg-blue-50/50 border border-blue-200 space-y-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-2xl neo-raised flex items-center justify-center bg-blue-100 text-blue-600 shrink-0 mt-0.5">
          <Info className="w-5 h-5" />
        </div>
        <div className="flex-1 text-left">
          <h3 className="font-bold text-blue-900">{title}</h3>
          {message && <p className="text-sm text-blue-700 mt-1">{message}</p>}
        </div>
      </div>
      {action && <div className="flex justify-end pt-2">{action}</div>}
    </div>
  );
};

interface SkeletonProps {
  variant?: 'text' | 'card' | 'table-row' | 'avatar' | 'button';
  count?: number;
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'text',
  count = 1,
  className = '',
}) => {
  const baseClass = 'animate-pulse bg-slate-200 rounded';

  const variants = {
    text: 'h-4 w-full',
    card: 'h-32 w-full rounded-2xl',
    'table-row': 'h-12 w-full',
    avatar: 'h-10 w-10 rounded-full',
    button: 'h-10 w-24 rounded-xl',
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`${baseClass} ${variants[variant]}`} />
      ))}
    </div>
  );
};