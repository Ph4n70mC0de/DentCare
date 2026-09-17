import React from 'react';

interface NeoCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  variant?: 'raised' | 'raised-sm' | 'raised-lg' | 'inset' | 'inset-sm';
  hoverable?: boolean;
}

export const NeoCard: React.FC<NeoCardProps> = ({
  children,
  className = '',
  variant = 'raised',
  hoverable = false,
  ...props
}) => {
  const variantClass = {
    'raised': 'neo-raised',
    'raised-sm': 'neo-raised-sm',
    'raised-lg': 'neo-raised-lg',
    'inset': 'neo-inset',
    'inset-sm': 'neo-inset-sm'
  }[variant];

  const hoverClass = hoverable
    ? 'transition-all duration-200 hover:-translate-y-1 cursor-pointer'
    : '';

  return (
    <div
      className={`rounded-2xl p-6 ${variantClass} ${hoverClass} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
