import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, AlertTriangle, ShieldCheck, Sparkles, MapPin, Clock } from 'lucide-react';
import { Card, Button, StatusBadge, Select, LoadingSpinner, EmptyState, PageHeader } from '@/components/ui';
import { useIncidents } from '@/hooks/useIncidents';
import { formatDistanceToNow, format } from 'date-fns';
import { getIncidentTypeLabel, cn } from '@/utils';
import type { Incident } from '@/types';

export default function IncidentsPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const navigate = useNavigate();

  const { data, isLoading } = useIncidents({
    status: statusFilter || undefined,
    incident_type: typeFilter || undefined,
    severity: severityFilter || undefined,
    page,
    per_page: 15,
  });

  const rawIncidents: Incident[] = data?.items || [];
  const incidents = searchQuery.trim()
    ? rawIncidents.filter(
        (i) =>
          i.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          i.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          i.location_name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : rawIncidents;

  const totalPages = data?.total_pages || 1;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* 1. Header */}
      <PageHeader
        title="Incident Intelligence"
        subtitle="Live feed of student reports, security dispatches, and hazard verifications across campus."
        badge={`${data?.total || incidents.length} Reports`}
        badgeVariant="info"
        actions={
          <Link to="/incidents/new">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Report Incident
            </Button>
          </Link>
        }
      />

      {/* 2. Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by title, keyword, or campus location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs font-medium rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-slate-50/50"
            />
          </div>

          {/* Filter Selects */}
          <div className="flex flex-wrap gap-2">
            <div className="w-36">
              <Select
                options={[
                  { value: '', label: 'All Statuses' },
                  { value: 'reported', label: 'Reported' },
                  { value: 'verified', label: 'Verified' },
                  { value: 'in_progress', label: 'In Progress' },
                  { value: 'resolved', label: 'Resolved' },
                  { value: 'rejected', label: 'Rejected' },
                ]}
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            <div className="w-36">
              <Select
                options={[
                  { value: '', label: 'All Severities' },
                  { value: 'low', label: 'Low' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'high', label: 'High' },
                  { value: 'critical', label: 'Critical' },
                ]}
                value={severityFilter}
                onChange={(e) => {
                  setSeverityFilter(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            <div className="w-36">
              <Select
                options={[
                  { value: '', label: 'All Types' },
                  ...Object.values({
                    theft: 'Theft',
                    assault: 'Assault',
                    harassment: 'Harassment',
                    fire: 'Fire',
                    medical: 'Medical',
                    structural: 'Structural',
                    suspicious_activity: 'Suspicious Activity',
                    vandalism: 'Vandalism',
                    other: 'Other',
                  }).map((v) => ({
                    value: v.toLowerCase().replace(/ /g, '_'),
                    label: v,
                  })),
                ]}
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Incidents List */}
      {isLoading ? (
        <div className="py-20 flex justify-center">
          <LoadingSpinner size="lg" />
        </div>
      ) : incidents.length === 0 ? (
        <EmptyState
          title="No incidents match criteria"
          description="Try clearing your search query or selecting a different status/severity filter."
          action={
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setStatusFilter('');
                setTypeFilter('');
                setSeverityFilter('');
                setSearchQuery('');
              }}
            >
              Reset Filters
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {incidents.map((incident: Incident) => {
            let timeAgo = '';
            try {
              timeAgo = formatDistanceToNow(new Date(incident.created_at), { addSuffix: true });
            } catch {
              timeAgo = 'Recently';
            }

            const isCritical = incident.severity === 'critical';
            const isHigh = incident.severity === 'high';

            return (
              <div
                key={incident.id}
                onClick={() => navigate(`/incidents/${incident.id}`)}
                className={cn(
                  'bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 hover:border-slate-300 hover:shadow-card-hover transition-all duration-150 cursor-pointer relative overflow-hidden group',
                  isCritical && 'border-l-4 border-l-rose-500',
                  isHigh && 'border-l-4 border-l-orange-500'
                )}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-brand-600 transition-colors">
                        {incident.title}
                      </h3>
                      {incident.status === 'verified' && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                          <ShieldCheck className="w-3 h-3" />
                          Security Verified
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-500 line-clamp-2">
                      {incident.description || 'No additional details provided.'}
                    </p>

                    <div className="flex items-center gap-4 pt-2 text-xs text-slate-400 font-medium">
                      <span className="text-slate-600 font-semibold">
                        {getIncidentTypeLabel(incident.incident_type)}
                      </span>
                      {incident.location_name && (
                        <span className="flex items-center gap-1 text-slate-500">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {incident.location_name}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-slate-400">
                        <Clock className="w-3.5 h-3.5" />
                        {timeAgo}
                      </span>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <StatusBadge severity={incident.severity} />
                    <StatusBadge status={incident.status} />
                  </div>
                </div>
              </div>
            );
          })}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                Previous
              </Button>
              <span className="text-xs font-semibold text-slate-500 font-mono">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
