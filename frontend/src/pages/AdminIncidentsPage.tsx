import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Eye, Search, Filter, ShieldCheck, CheckCheck } from 'lucide-react';
import {
  Card,
  Button,
  Select,
  LoadingSpinner,
  DataTable,
  StatusBadge,
  ConfirmDialog,
  PageHeader,
} from '@/components/ui';
import {
  useIncidents,
  useVerifyIncident,
  useResolveIncident,
  useRejectIncident,
} from '@/hooks/useIncidents';
import { format } from 'date-fns';
import { getIncidentTypeLabel } from '@/utils';
import toast from 'react-hot-toast';

export default function AdminIncidentsPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [page, setPage] = useState(1);
  const navigate = useNavigate();
  const [actionTarget, setActionTarget] = useState<{ id: string; action: string } | null>(null);

  const { data, isLoading } = useIncidents({
    status: statusFilter || undefined,
    severity: severityFilter || undefined,
    page,
    per_page: 15,
  });

  const verifyIncident = useVerifyIncident();
  const resolveIncident = useResolveIncident();
  const rejectIncident = useRejectIncident();

  const incidents = data?.items || [];
  const totalPages = data?.total_pages || 1;

  const handleAction = async () => {
    if (!actionTarget) return;
    try {
      if (actionTarget.action === 'verify') {
        await verifyIncident.mutateAsync(actionTarget.id);
        toast.success('Incident verified by security');
      } else if (actionTarget.action === 'resolve') {
        await resolveIncident.mutateAsync(actionTarget.id);
        toast.success('Incident marked as resolved');
      } else if (actionTarget.action === 'reject') {
        await rejectIncident.mutateAsync(actionTarget.id);
        toast.success('Incident rejected');
      }
    } catch {
      toast.error('Action failed');
    }
    setActionTarget(null);
  };

  const columns = [
    {
      key: 'title',
      header: 'Incident Case',
      sortable: true,
      render: (item: typeof incidents[0]) => (
        <div>
          <span className="font-bold text-slate-900 block text-xs">{item.title}</span>
          <span className="text-[11px] text-slate-500 font-mono">
            {item.location_name || 'Campus Grounds'}
          </span>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Category',
      render: (item: typeof incidents[0]) => (
        <span className="text-xs font-semibold text-slate-600">
          {getIncidentTypeLabel(item.incident_type)}
        </span>
      ),
    },
    {
      key: 'severity',
      header: 'Severity',
      render: (item: typeof incidents[0]) => <StatusBadge severity={item.severity} />,
    },
    {
      key: 'status',
      header: 'Status',
      render: (item: typeof incidents[0]) => <StatusBadge status={item.status} />,
    },
    {
      key: 'created_at',
      header: 'Logged Date',
      sortable: true,
      render: (item: typeof incidents[0]) => (
        <span className="text-xs text-slate-500 font-mono">
          {format(new Date(item.created_at), 'MMM d, h:mm a')}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Triage Actions',
      render: (item: typeof incidents[0]) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => navigate(`/incidents/${item.id}`)}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          {item.status === 'reported' && (
            <>
              <button
                onClick={() => setActionTarget({ id: item.id, action: 'verify' })}
                className="p-1.5 rounded-lg hover:bg-purple-50 text-purple-600"
                title="Verify Incident"
              >
                <ShieldCheck className="w-4 h-4" />
              </button>
              <button
                onClick={() => setActionTarget({ id: item.id, action: 'reject' })}
                className="p-1.5 rounded-lg hover:bg-red-50 text-red-600"
                title="Reject Report"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </>
          )}
          {(item.status === 'verified' || item.status === 'in_progress') && (
            <button
              onClick={() => setActionTarget({ id: item.id, action: 'resolve' })}
              className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600"
              title="Resolve Incident"
            >
              <CheckCircle className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  const actionLabels: Record<string, string> = {
    verify: 'Verify & Authorize',
    resolve: 'Resolve & Close',
    reject: 'Reject',
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="Incident Triage & Management"
        subtitle="Review student submissions, dispatch campus patrol, and verify danger perimeters."
        badge={`${data?.total || incidents.length} Cases`}
        badgeVariant="info"
      />

      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap gap-3">
        <div className="w-44">
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
        <div className="w-44">
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
      </div>

      <Card padding="none">
        <DataTable
          columns={columns}
          data={incidents}
          isLoading={isLoading}
          keyExtractor={(item) => item.id}
          onRowClick={(item) => navigate(`/incidents/${item.id}`)}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          emptyMessage="No incidents found matching criteria"
        />
      </Card>

      <ConfirmDialog
        isOpen={!!actionTarget}
        onClose={() => setActionTarget(null)}
        onConfirm={handleAction}
        title={`${actionLabels[actionTarget?.action || ''] || 'Confirm'} Incident?`}
        message={`Are you sure you want to execute '${actionTarget?.action}' on this incident? It will immediately update campus risk routing.`}
        confirmText={actionLabels[actionTarget?.action || ''] || 'Confirm'}
        variant={actionTarget?.action === 'reject' ? 'danger' : 'primary'}
        isLoading={verifyIncident.isPending || resolveIncident.isPending || rejectIncident.isPending}
      />
    </div>
  );
}
