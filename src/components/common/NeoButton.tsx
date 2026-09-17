import React from 'react';

export interface NeoButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'danger' | 'success' | 'inset';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export const NeoButton: React.FC<NeoButtonProps> = ({
  children,
  variant = 'default',
  size = 'md',
  icon,
  iconPosition = 'left',
  className = '',
  disabled,
  ...props
}) => {
  const variantStyles = {
    default: 'neo-btn text-slate-700 hover:text-slate-900',
    primary: 'neo-btn-primary',
    danger: 'neo-btn-danger',
    success: 'neo-btn-success',
    inset: 'neo-inset text-slate-700'
  }[variant];

  const sizeStyles = {
    sm: 'px-3.5 py-1.5 text-xs font-semibold rounded-xl gap-1.5',
    md: 'px-5 py-2.5 text-sm font-semibold rounded-2xl gap-2',
    lg: 'px-7 py-3.5 text-base font-bold rounded-2xl gap-2.5'
  }[size];

  const disabledStyles = disabled
    ? 'opacity-50 cursor-not-allowed transform-none shadow-none pointer-events-none'
    : 'cursor-pointer';

  return (
    <button
      disabled={disabled}
      className={`inline-flex items-center justify-center select-none font-medium outline-none transition-all active:scale-[0.98] ${sizeStyles} ${variantStyles} ${disabledStyles} ${className}`}
      {...props}
    >
      {icon && iconPosition === 'left' && <span className="shrink-0">{icon}</span>}
      {children && <span>{children}</span>}
      {icon && iconPosition === 'right' && <span className="shrink-0">{icon}</span>}
    </button>
  );
};
