import React from 'react';
import { cn } from '@/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KPICardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
    label?: string;
  };
  color?: 'blue' | 'green' | 'red' | 'amber' | 'purple' | 'slate';
  className?: string;
}

export default function KPICard({
  icon,
  label,
  value,
  subtitle,
  trend,
  color = 'blue',
  className,
}: KPICardProps) {
  const colorConfigs = {
    blue: {
      bg: 'bg-brand-50 text-brand-600 border-brand-100',
      dot: 'bg-brand-500',
    },
    green: {
      bg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      dot: 'bg-emerald-500',
    },
    red: {
      bg: 'bg-rose-50 text-rose-600 border-rose-100',
      dot: 'bg-rose-500',
    },
    amber: {
      bg: 'bg-amber-50 text-amber-600 border-amber-100',
      dot: 'bg-amber-500',
    },
    purple: {
      bg: 'bg-purple-50 text-purple-600 border-purple-100',
      dot: 'bg-purple-500',
    },
    slate: {
      bg: 'bg-slate-100 text-slate-700 border-slate-200',
      dot: 'bg-slate-500',
    },
  };

  const config = colorConfigs[color] || colorConfigs.blue;

  return (
    <div
      className={cn(
        'bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_1px_3px_rgba(15,23,42,0.03)] hover:border-slate-300 hover:shadow-card-hover transition-all duration-150',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {label}
        </span>
        <div
          className={cn(
            'w-9 h-9 rounded-xl flex items-center justify-center border shadow-xs',
            config.bg
          )}
        >
          {icon}
        </div>
      </div>

      <div className="mt-3 flex items-baseline justify-between">
        <p className="text-3xl font-extrabold text-slate-900 tracking-tight font-sans">
          {value}
        </p>

        {trend && (
          <div
            className={cn(
              'flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border',
              trend.direction === 'up' && 'text-rose-700 bg-rose-50 border-rose-200',
              trend.direction === 'down' && 'text-emerald-700 bg-emerald-50 border-emerald-200',
              trend.direction === 'neutral' && 'text-slate-600 bg-slate-50 border-slate-200'
            )}
          >
            {trend.direction === 'up' && <TrendingUp className="w-3.5 h-3.5" />}
            {trend.direction === 'down' && <TrendingDown className="w-3.5 h-3.5" />}
            {trend.direction === 'neutral' && <Minus className="w-3.5 h-3.5" />}
            <span>{Math.abs(trend.value)}%</span>
          </div>
        )}
      </div>

      {subtitle && (
        <p className="text-xs text-slate-400 mt-1 font-medium">{subtitle}</p>
      )}
    </div>
  );
}
