import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}

export function formatTime(minutes: number): string {
  if (minutes < 1) return 'Less than 1 min';
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

export function getSeverityColor(severity: string): string {
  switch (severity) {
    case 'low': return 'text-yellow-500 bg-yellow-50 border-yellow-200';
    case 'medium': return 'text-orange-500 bg-orange-50 border-orange-200';
    case 'high': return 'text-red-500 bg-red-50 border-red-200';
    case 'critical': return 'text-red-700 bg-red-100 border-red-300';
    default: return 'text-slate-500 bg-slate-50 border-slate-200';
  }
}

export function getSeverityDotColor(severity: string): string {
  switch (severity) {
    case 'low': return '#EAB308';
    case 'medium': return '#F97316';
    case 'high': return '#EF4444';
    case 'critical': return '#DC2626';
    default: return '#94A3B8';
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'reported': return 'text-blue-600 bg-blue-50 border-blue-200';
    case 'verified': return 'text-purple-600 bg-purple-50 border-purple-200';
    case 'in_progress': return 'text-amber-600 bg-amber-50 border-amber-200';
    case 'resolved': return 'text-green-600 bg-green-50 border-green-200';
    case 'rejected': return 'text-slate-600 bg-slate-50 border-slate-200';
    default: return 'text-slate-500 bg-slate-50 border-slate-200';
  }
}

export function getIncidentTypeLabel(type: string): string {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

export function getRiskLevelColor(level: string): string {
  switch (level) {
    case 'low': return '#16A34A';
    case 'moderate': return '#D97706';
    case 'high': return '#EF4444';
    case 'critical': return '#DC2626';
    default: return '#94A3B8';
  }
}
