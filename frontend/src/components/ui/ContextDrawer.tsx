import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/utils';

interface ContextDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  position?: 'right' | 'bottom';
  className?: string;
}

export default function ContextDrawer({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  position = 'right',
  className,
}: ContextDrawerProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop for mobile */}
      <div
        className="fixed inset-0 bg-slate-950/20 backdrop-blur-xs z-[1001] lg:hidden transition-opacity"
        onClick={onClose}
      />

      <div
        className={cn(
          'fixed z-[1002] bg-white/95 backdrop-blur-md border border-slate-200 shadow-2xl transition-all duration-250 flex flex-col',
          position === 'right'
            ? 'inset-y-0 right-0 w-full sm:w-96 animate-in slide-in-from-right duration-200'
            : 'inset-x-0 bottom-0 max-h-[80vh] rounded-t-3xl border-b-0 animate-in slide-in-from-bottom duration-200',
          className
        )}
      >
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-100 flex items-start justify-between gap-3">
          <div>
            {title && <h3 className="text-sm font-bold text-slate-900 leading-tight">{title}</h3>}
            {subtitle && <p className="text-[11px] text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Close Panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4">{children}</div>
      </div>
    </>
  );
}
