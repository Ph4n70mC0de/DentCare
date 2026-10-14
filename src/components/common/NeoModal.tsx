import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface NeoModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
}

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export const NeoModal: React.FC<NeoModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'lg'
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Remember the element that opened the modal so focus can be restored.
    previouslyFocused.current = document.activeElement as HTMLElement | null;

    const dialog = dialogRef.current;

    // Move focus into the dialog on open.
    const focusables = dialog?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
    if (focusables && focusables.length > 0) {
      focusables[0].focus();
    } else {
      dialog?.focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      // Trap Tab focus inside the dialog.
      if (e.key === 'Tab' && dialog) {
        const items = dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
        if (items.length === 0) {
          e.preventDefault();
          return;
        }

        const first = items[0];
        const last = items[items.length - 1];
        const active = document.activeElement;

        if (!dialog.contains(active)) {
          e.preventDefault();
          first.focus();
          return;
        }

        if (e.shiftKey && active === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
      // Restore focus to the triggering element.
      previouslyFocused.current?.focus();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const widthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl'
  }[maxWidth];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-slate-900/35 backdrop-blur-xs">
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        ref={dialogRef}
        className={`relative w-full ${widthClasses} neo-raised-lg rounded-3xl p-6 sm:p-8 bg-[#E8EEF5] text-slate-800 z-10 my-8 shadow-2xl transition-all max-h-[90vh] flex flex-col`}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : undefined}
        tabIndex={-1}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-300/40 shrink-0">
          <div>
            <h3 className="text-xl font-bold text-slate-800 tracking-tight">{title}</h3>
            {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="neo-btn p-2 rounded-xl text-slate-500 hover:text-slate-800 outline-none transition-all cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="mt-5 overflow-y-auto pr-1 flex-1">
          {children}
        </div>
      </div>
    </div>
  );
};