import React from 'react';

export interface NeoBadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  size?: 'sm' | 'md';
  className?: string;
  icon?: React.ReactNode;
}

export const NeoBadge: React.FC<NeoBadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'sm',
  className = '',
  icon
}) => {
  const variantStyles = {
    primary: 'bg-blue-100/80 text-blue-700 border border-blue-200/60 shadow-xs',
    success: 'bg-emerald-100/80 text-emerald-700 border border-emerald-200/60 shadow-xs',
    warning: 'bg-amber-100/80 text-amber-800 border border-amber-200/60 shadow-xs',
    danger: 'bg-rose-100/80 text-rose-700 border border-rose-200/60 shadow-xs',
    info: 'bg-indigo-100/80 text-indigo-700 border border-indigo-200/60 shadow-xs',
    neutral: 'bg-slate-200/60 text-slate-700 border border-slate-300/60 shadow-xs'
  }[variant];

  const sizeStyles = {
    sm: 'px-2.5 py-0.5 text-xs font-semibold rounded-full',
    md: 'px-3 py-1 text-xs font-semibold rounded-full'
  }[size];

  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap select-none font-medium ${sizeStyles} ${variantStyles} ${className}`}>
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};
