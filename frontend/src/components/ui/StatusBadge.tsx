import { cn } from '@/utils';

interface StatusBadgeProps {
  status?: string;
  severity?: string;
  className?: string;
}

export default function StatusBadge({ status, severity, className }: StatusBadgeProps) {
  if (severity) {
    const sev = severity.toLowerCase();
    const config = {
      critical: {
        bg: 'bg-rose-50 text-rose-700 border-rose-200/80',
        dot: 'bg-rose-500 animate-pulse',
      },
      high: {
        bg: 'bg-orange-50 text-orange-700 border-orange-200/80',
        dot: 'bg-orange-500',
      },
      medium: {
        bg: 'bg-amber-50 text-amber-700 border-amber-200/80',
        dot: 'bg-amber-500',
      },
      moderate: {
        bg: 'bg-amber-50 text-amber-700 border-amber-200/80',
        dot: 'bg-amber-500',
      },
      low: {
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
        dot: 'bg-emerald-500',
      },
    }[sev] || {
      bg: 'bg-slate-50 text-slate-700 border-slate-200',
      dot: 'bg-slate-400',
    };

    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize tracking-tight select-none',
          config.bg,
          className
        )}
      >
        <span className={cn('w-1.5 h-1.5 rounded-full', config.dot)} />
        {severity}
      </span>
    );
  }

  if (status) {
    const st = status.toLowerCase();
    const config = {
      reported: {
        bg: 'bg-blue-50 text-blue-700 border-blue-200/80',
        dot: 'bg-blue-500',
      },
      verified: {
        bg: 'bg-purple-50 text-purple-700 border-purple-200/80',
        dot: 'bg-purple-500',
      },
      in_progress: {
        bg: 'bg-amber-50 text-amber-700 border-amber-200/80',
        dot: 'bg-amber-500 animate-pulse',
      },
      resolved: {
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
        dot: 'bg-emerald-500',
      },
      rejected: {
        bg: 'bg-slate-100 text-slate-600 border-slate-200',
        dot: 'bg-slate-400',
      },
    }[st] || {
      bg: 'bg-slate-50 text-slate-700 border-slate-200',
      dot: 'bg-slate-400',
    };

    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize tracking-tight select-none',
          config.bg,
          className
        )}
      >
        <span className={cn('w-1.5 h-1.5 rounded-full', config.dot)} />
        {status.replace(/_/g, ' ')}
      </span>
    );
  }

  return null;
}
