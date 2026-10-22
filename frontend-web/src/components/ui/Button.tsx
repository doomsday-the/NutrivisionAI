import React from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const baseClasses =
    'inline-flex items-center justify-center font-bold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none select-none cursor-pointer';

  const sizeClasses = {
    sm: 'text-xs px-3.5 py-1.5 gap-1.5 rounded-lg',
    md: 'text-xs sm:text-sm px-4 py-2 gap-2 rounded-xl',
    lg: 'text-sm sm:text-base px-6 py-3 gap-2.5 rounded-xl',
    icon: 'p-2 rounded-lg',
  }[size];

  const variantClasses = {
    primary:
      'bg-white text-black hover:bg-slate-200 border border-white shadow-xs font-bold tracking-tight',
    secondary:
      'bg-[#122226] hover:bg-[#182c32] text-white border border-[#1d3238]',
    outline:
      'bg-[#0b171b] hover:bg-[#122227] text-white hover:text-white border border-[#18282c] hover:border-[#263e44]',
    ghost:
      'bg-transparent hover:bg-[#102026] text-[#8ba0a6] hover:text-white border border-transparent',
    danger:
      'bg-[#271014] hover:bg-[#39151c] text-[#f43f5e] border border-[#521c25]',
  }[variant];

  return (
    <button
      className={`${baseClasses} ${sizeClasses} ${variantClasses} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 size={size === 'sm' ? 13 : 15} className="animate-spin text-current" />
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
      {children}
    </button>
  );
}
