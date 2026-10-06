import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  MapPin,
  Clock,
  User,
  ChevronLeft,
  Shield,
  ShieldCheck,
  AlertTriangle,
  Route,
  Activity,
  CheckCircle2,
  Building,
} from 'lucide-react';
import { Card, Button, StatusBadge, LoadingSpinner, PageHeader } from '@/components/ui';
import { useIncident } from '@/hooks/useIncidents';
import { useMapStore } from '@/stores/mapStore';
import { format, formatDistanceToNow } from 'date-fns';
import { getIncidentTypeLabel } from '@/utils';

export default function IncidentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: incident, isLoading } = useIncident(id || '');
  const { setSelectedOrigin, setShowRoute } = useMapStore();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20 space-y-4">
        <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Incident Not Found</h2>
        <p className="text-sm text-slate-500">
          The requested incident report could not be found or may have been removed.
        </p>
        <Link to="/incidents">
          <Button variant="secondary">Return to Incidents</Button>
        </Link>
      </div>
    );
  }

  const timeline = [
    {
      label: 'Reported by Student / Reporter',
      date: incident.created_at,
      done: true,
      desc: 'Initial incident intake logged into campus safety database.',
    },
    {
      label: 'Security Verification & Assessment',
      date: incident.verified_at,
      done: incident.status !== 'reported' && incident.status !== 'rejected',
      desc: incident.verified_at
        ? 'Verified by Campus Patrol. Risk perimeter established.'
        : 'Awaiting security officer verification.',
    },
    {
      label: 'Response Dispatch & Action',
      date: null,
      done: incident.status === 'in_progress' || incident.status === 'resolved',
      desc:
        incident.status === 'in_progress' || incident.status === 'resolved'
          ? 'Patrol units and medical responders active on site.'
          : 'Pending dispatch.',
    },
    {
      label: 'Resolution & Clearance',
      date: incident.resolved_at,
      done: incident.status === 'resolved',
      desc:
        incident.status === 'resolved'
          ? 'Incident cleared. Hazard removed from dynamic routing.'
          : 'Case currently open.',
    },
  ];

  const planRouteAround = () => {
    setSelectedOrigin({
      lat: incident.latitude + 0.0006,
      lng: incident.longitude + 0.0006,
      name: `Safe Point near ${incident.location_name || 'Incident Area'}`,
    });
    setShowRoute(true);
    navigate('/routes');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back Link */}
      <Link
        to="/incidents"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to Incident Feed
      </Link>

      {/* Header Docket */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                CASE #{incident.id.slice(0, 8)}
              </span>
              {incident.status === 'verified' && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                  <ShieldCheck className="w-3 h-3" />
                  Verified Audit
                </span>
              )}
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {incident.title}
            </h1>
            <p className="text-xs text-slate-500">
              Category:{' '}
              <span className="font-semibold text-slate-700">
                {getIncidentTypeLabel(incident.incident_type)}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <StatusBadge severity={incident.severity} />
            <StatusBadge status={incident.status} />
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Clock className="w-4 h-4 text-slate-400" />
            <span>
              Reported on {format(new Date(incident.created_at), 'MMM d, yyyy • h:mm a')}
            </span>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={planRouteAround}
            leftIcon={<Route className="w-4 h-4 text-brand-600" />}
          >
            Calculate Safe Detour
          </Button>
        </div>
      </div>

      {/* Case File Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Full Description & Telemetry */}
        <div className="lg:col-span-7 space-y-6">
          <Card>
            <h3 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100 mb-3">
              Incident Overview & Findings
            </h3>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
              {incident.description || 'No detailed narrative provided.'}
            </p>

            <div className="mt-6 pt-4 border-t border-slate-100 grid grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  Location Name
                </span>
                <p className="font-bold text-slate-900 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-brand-600" />
                  {incident.location_name || 'Campus Grounds'}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  Building / Sector
                </span>
                <p className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-slate-500" />
                  {incident.building || 'General Zone'}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  GPS Coordinates
                </span>
                <p className="font-mono text-slate-700">
                  {incident.latitude.toFixed(5)}, {incident.longitude.toFixed(5)}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  Reporter Identity
                </span>
                <p className="font-medium text-slate-700 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  {incident.reporter_name || `User #${incident.reporter_id.slice(0, 6)}`}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Case Progress Audit Timeline */}
        <div className="lg:col-span-5 space-y-6">
          <Card>
            <h3 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100 mb-4">
              Response Progress
            </h3>

            <div className="space-y-4">
              {timeline.map((step, i) => (
                <div key={step.label} className="flex items-start gap-3 relative">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        step.done
                          ? 'bg-emerald-500 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-400 border border-slate-200'
                      }`}
                    >
                      {step.done ? '✓' : i + 1}
                    </div>
                    {i < timeline.length - 1 && (
                      <div
                        className={`w-0.5 h-10 mt-1 ${
                          step.done ? 'bg-emerald-300' : 'bg-slate-200'
                        }`}
                      />
                    )}
                  </div>

                  <div className="flex-1 min-w-0 pt-0.5">
                    <p
                      className={`text-xs font-bold ${
                        step.done ? 'text-slate-900' : 'text-slate-400'
                      }`}
                    >
                      {step.label}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">
                      {step.desc}
                    </p>
                    {step.date && (
                      <p className="text-[10px] text-slate-400 font-mono mt-1">
                        {format(new Date(step.date), 'MMM d, h:mm a')}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
