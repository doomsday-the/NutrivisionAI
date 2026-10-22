import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  interactive?: boolean;
}

export function Card({
  children,
  className = '',
  interactive = false,
  ...props
}: CardProps) {
  const baseClasses = interactive ? 'health-card-interactive' : 'health-card';

  return (
    <div className={`${baseClasses} p-6 sm:p-7 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex items-center justify-between gap-3 mb-5 ${className}`}>
      {children}
    </div>
  );
}

export function CardTitle({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h3 className={`text-sm font-bold text-white tracking-tight flex items-center gap-2 ${className}`}>
      {children}
    </h3>
  );
}

export function CardDescription({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p className={`text-xs text-[#8ba0a6] font-normal ${className}`}>
      {children}
    </p>
  );
}
