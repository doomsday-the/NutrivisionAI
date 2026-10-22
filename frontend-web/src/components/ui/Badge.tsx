import React from 'react';

export type BadgeVariant = 'emerald' | 'amber' | 'rose' | 'sky' | 'neutral' | 'outline' | 'white';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
}

export function Badge({
  children,
  variant = 'emerald',
  size = 'md',
  icon,
  className = '',
  ...props
}: BadgeProps) {
  const baseClasses =
    'inline-flex items-center font-bold rounded-full select-none tracking-tight';

  const sizeClasses = {
    sm: 'text-[10px] px-2.5 py-0.5 gap-1',
    md: 'text-xs px-3 py-1 gap-1.5',
  }[size];

  const variantClasses = {
    emerald: 'bg-[#062c21] text-[#34d399] border border-[#0d5943]',
    amber: 'bg-[#2d1c06] text-[#fbbf24] border border-[#59370d]',
    rose: 'bg-[#2d0f17] text-[#fb7185] border border-[#591d2c]',
    sky: 'bg-[#082236] text-[#38bdf8] border border-[#10446b]',
    neutral: 'bg-[#0e1b1f] text-[#8ba0a6] border border-[#192b31]',
    outline: 'bg-transparent text-[#8ba0a6] border border-[#1b2d33]',
    white: 'bg-white text-black font-extrabold',
  }[variant];

  return (
    <span className={`${baseClasses} ${sizeClasses} ${variantClasses} ${className}`} {...props}>
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </span>
  );
}
