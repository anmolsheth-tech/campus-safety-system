import React from 'react';
import { cn } from '@/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'success' | 'dark';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
}

export default function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles =
    'inline-flex items-center justify-center font-bold rounded-xl transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 select-none active:scale-[0.98] disabled:cursor-not-allowed disabled:active:scale-100';

  const variants = {
    primary:
      'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-sm border border-blue-700/40 focus-visible:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 disabled:shadow-none',
    secondary:
      'bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 border border-slate-200 shadow-sm hover:border-slate-300 focus-visible:ring-slate-400 disabled:bg-slate-50 disabled:text-slate-300 disabled:border-slate-100',
    danger:
      'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white shadow-sm border border-red-700/40 focus-visible:ring-red-500 disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 disabled:shadow-none',
    ghost:
      'text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-slate-400 disabled:text-slate-300 disabled:hover:bg-transparent',
    outline:
      'border border-slate-300 bg-transparent text-slate-700 hover:bg-slate-50 focus-visible:ring-blue-500 disabled:text-slate-300 disabled:border-slate-200',
    success:
      'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-sm border border-emerald-700/40 focus-visible:ring-emerald-500 disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 disabled:shadow-none',
    dark:
      'bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white shadow-sm border border-slate-800 focus-visible:ring-slate-700 disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 disabled:shadow-none',
  };

  const sizes = {
    xs: 'px-2.5 py-1 text-xs gap-1.5 rounded-lg',
    sm: 'px-3 py-1.5 text-xs font-bold gap-1.5 rounded-lg',
    md: 'px-4 py-2.5 text-xs font-bold gap-2 rounded-xl',
    lg: 'px-5 py-3 text-sm font-bold gap-2.5 rounded-xl',
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin h-4 w-4 text-current shrink-0" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : (
        leftIcon && <span className="shrink-0">{leftIcon}</span>
      )}
      <span className="truncate">{children}</span>
      {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </button>
  );
}
