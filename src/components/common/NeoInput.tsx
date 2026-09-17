import React, { forwardRef } from 'react';

export interface NeoInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export const NeoInput = forwardRef<HTMLInputElement, NeoInputProps>(({
  label,
  error,
  helperText,
  icon,
  rightElement,
  className = '',
  id,
  ...props
}, ref) => {
  const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

  return (
    <div className="w-full flex flex-col space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="text-xs font-semibold tracking-wide text-slate-600 px-1">
          {label}
        </label>
      )}
      <div className="relative flex items-center w-full">
        {icon && (
          <div className="absolute left-3.5 text-slate-400 pointer-events-none flex items-center justify-center">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`w-full neo-inset px-4 py-2.5 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 outline-none transition-all focus:ring-2 focus:ring-blue-500/30 ${
            icon ? 'pl-10' : ''
          } ${rightElement ? 'pr-12' : ''} ${error ? 'ring-2 ring-red-400' : ''} ${className}`}
          {...props}
        />
        {rightElement && (
          <div className="absolute right-3 text-slate-500 flex items-center">
            {rightElement}
          </div>
        )}
      </div>
      {error ? (
        <p className="text-xs font-medium text-red-600 px-1">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-slate-500 px-1">{helperText}</p>
      ) : null}
    </div>
  );
});

NeoInput.displayName = 'NeoInput';
