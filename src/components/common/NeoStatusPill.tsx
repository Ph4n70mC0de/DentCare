import React from 'react';
import { AppointmentStatus } from '../../types';

interface NeoStatusPillProps {
  status: AppointmentStatus;
  className?: string;
  size?: 'sm' | 'md';
}

export const NeoStatusPill: React.FC<NeoStatusPillProps> = ({
  status,
  className = '',
  size = 'sm'
}) => {
  const getStatusConfig = (st: AppointmentStatus) => {
    switch (st) {
      case 'Requested':
      case 'Pending':
        return {
          dot: 'bg-amber-500',
          bg: 'bg-amber-50 text-amber-800 border-amber-200/80',
          label: st
        };
      case 'Confirmed':
        return {
          dot: 'bg-blue-600',
          bg: 'bg-blue-50 text-blue-700 border-blue-200/80',
          label: 'Confirmed'
        };
      case 'Checked-In':
        return {
          dot: 'bg-cyan-500',
          bg: 'bg-cyan-50 text-cyan-800 border-cyan-200/80',
          label: 'Checked In'
        };
      case 'Waiting':
        return {
          dot: 'bg-indigo-500 animate-pulse',
          bg: 'bg-indigo-50 text-indigo-800 border-indigo-200/80',
          label: 'In Waiting Room'
        };
      case 'In-Consultation':
        return {
          dot: 'bg-purple-600 animate-ping',
          bg: 'bg-purple-50 text-purple-800 border-purple-200/80',
          label: 'In Consultation'
        };
      case 'Payment-Pending':
        return {
          dot: 'bg-orange-500',
          bg: 'bg-orange-50 text-orange-800 border-orange-200/80',
          label: 'Pending Payment'
        };
      case 'Completed':
        return {
          dot: 'bg-emerald-600',
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
          label: 'Completed'
        };
      case 'Rescheduled':
        return {
          dot: 'bg-sky-500',
          bg: 'bg-sky-50 text-sky-800 border-sky-200/80',
          label: 'Rescheduled'
        };
      case 'Cancelled':
        return {
          dot: 'bg-rose-500',
          bg: 'bg-rose-50 text-rose-700 border-rose-200/80',
          label: 'Cancelled'
        };
      case 'No-Show':
        return {
          dot: 'bg-red-700',
          bg: 'bg-red-100 text-red-900 border-red-300',
          label: 'No-Show'
        };
      case 'Emergency':
        return {
          dot: 'bg-rose-600 animate-bounce',
          bg: 'bg-rose-100 text-rose-900 border-rose-300 font-bold',
          label: 'EMERGENCY'
        };
      case 'Waitlisted':
        return {
          dot: 'bg-slate-500',
          bg: 'bg-slate-100 text-slate-700 border-slate-200',
          label: 'Waitlisted'
        };
      default:
        return {
          dot: 'bg-slate-400',
          bg: 'bg-slate-50 text-slate-600 border-slate-200',
          label: st
        };
    }
  };

  const config = getStatusConfig(status);
  const sizeClasses = size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border shadow-2xs font-semibold whitespace-nowrap ${config.bg} ${sizeClasses} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${config.dot}`} />
      <span>{config.label}</span>
    </span>
  );
};
