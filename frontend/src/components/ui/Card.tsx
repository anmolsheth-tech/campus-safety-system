import React from 'react';
import { cn } from '@/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'flat' | 'elevated' | 'glass' | 'subtle';
  padding?: 'none' | 'xs' | 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

export default function Card({
  children,
  className,
  variant = 'default',
  padding = 'md',
  onClick,
}: CardProps) {
  const variants = {
    default: 'bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(15,23,42,0.03)]',
    flat: 'bg-slate-50 border border-slate-200/70',
    elevated: 'bg-white border border-slate-200 shadow-md',
    glass: 'bg-white/90 backdrop-blur-md border border-slate-200/80 shadow-lg',
    subtle: 'bg-white/60 border border-slate-100',
  };

  const paddings = {
    none: '',
    xs: 'p-3',
    sm: 'p-4',
    md: 'p-5 lg:p-6',
    lg: 'p-6 lg:p-8',
  };

  return (
    <div
      className={cn(
        'rounded-2xl transition-all duration-150',
        variants[variant],
        paddings[padding],
        onClick && 'cursor-pointer hover:border-slate-300 hover:shadow-card-hover active:scale-[0.995]',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
