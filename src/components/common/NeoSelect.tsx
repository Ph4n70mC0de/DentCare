import React from 'react';

export interface NeoSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
}

export const NeoSelect: React.FC<NeoSelectProps> = ({
  label,
  error,
  helperText,
  icon,
  children,
  className = '',
  id,
  ...props
}) => {
  const selectId = id || (label ? `select-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

  return (
    <div className="w-full flex flex-col space-y-1.5">
      {label && (
        <label htmlFor={selectId} className="text-xs font-semibold tracking-wide text-slate-600 px-1">
          {label}
        </label>
      )}
      <div className="relative flex items-center w-full">
        {icon && (
          <div className="absolute left-3.5 text-slate-400 pointer-events-none flex items-center justify-center">
            {icon}
          </div>
        )}
        <select
          id={selectId}
          className={`w-full appearance-none neo-inset px-4 py-2.5 rounded-xl text-sm text-slate-800 outline-none transition-all focus:ring-2 focus:ring-blue-500/30 cursor-pointer ${
            icon ? 'pl-10' : ''
          } pr-10 ${error ? 'ring-2 ring-red-400' : ''} ${className}`}
          {...props}
        >
          {children}
        </select>
        <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
          ▼
        </div>
      </div>
      {error ? (
        <p className="text-xs font-medium text-red-600 px-1">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-slate-500 px-1">{helperText}</p>
      ) : null}
    </div>
  );
};
