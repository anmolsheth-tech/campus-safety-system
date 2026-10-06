import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Route,
  Siren,
  Shield,
  Clock,
  MapPin,
  ChevronRight,
  Activity,
  CheckCircle2,
  Phone,
  Sparkles,
  Radio,
  ArrowUpRight,
  TrendingUp,
  Compass,
  Eye,
  ShieldCheck,
} from 'lucide-react';
import { Card, KPICard, StatusBadge, LoadingSpinner, Badge, Button, PageHeader, KPICardSkeleton, ContextDrawer } from '@/components/ui';
import { incidentService } from '@/services/incidentService';
import { campusService } from '@/services/campusService';
import { useAuth } from '@/hooks/useAuth';
import { useMapStore } from '@/stores/mapStore';
import { getIncidentTypeLabel, cn } from '@/utils';
import { format, formatDistanceToNow } from 'date-fns';
import type { Incident } from '@/types';
import { CampusMap } from '@/components/map';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { setSelectedOrigin, setSelectedDestination, setShowRoute } = useMapStore();
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

  const { data: incidentsData, isLoading: incidentsLoading } = useQuery({
    queryKey: ['dashboard-incidents'],
    queryFn: () =>
      incidentService.getIncidents({ per_page: 30, sort_by: 'created_at', sort_order: 'desc' }),
  });

  const { data: emergencyLocations, isLoading: emergencyLoading } = useQuery({
    queryKey: ['dashboard-emergency'],
    queryFn: () => campusService.getEmergencyLocations(),
  });

  const incidents: Incident[] = incidentsData?.items || [];
  const activeIncidents = incidents.filter(
    (i: Incident) => i.status !== 'resolved' && i.status !== 'rejected'
  );
  const resolvedIncidents = incidents.filter((i: Incident) => i.status === 'resolved');
  const criticalIncidents = activeIncidents.filter((i) => i.severity === 'critical');
  const highIncidents = activeIncidents.filter((i) => i.severity === 'high');
  const moderateIncidents = activeIncidents.filter(
    (i) => i.severity === 'medium'
  );

  // Derive system safety state purely from real backend data
  const getSafetyStatus = () => {
    if (criticalIncidents.length > 0) {
      return {
        level: 'critical' as const,
        headline: 'CRITICAL THREAT ACTIVE',
        badge: 'CRITICAL ALERT',
        description: `${criticalIncidents.length} emergency hazard perimeter established on campus. Avoid red alert zones.`,
        bg: 'bg-rose-50/90 border-rose-300 text-rose-950 ring-1 ring-rose-300',
        dot: 'bg-rose-500 animate-ping',
        iconColor: 'text-rose-600',
      };
    }
    if (highIncidents.length > 0) {
      return {
        level: 'high' as const,
        headline: 'ELEVATED RISK LEVEL',
        badge: 'CAUTION ACTIVE',
        description: `${highIncidents.length} high-priority incident being monitored. A* routing active.`,
        bg: 'bg-orange-50/90 border-orange-300 text-orange-950 ring-1 ring-orange-300',
        dot: 'bg-orange-500 animate-pulse',
        iconColor: 'text-orange-600',
      };
    }
    if (activeIncidents.length > 0) {
      return {
        level: 'moderate' as const,
        headline: 'CAMPUS MONITORING ACTIVE',
        badge: 'ADVISORY',
        description: `${activeIncidents.length} minor incident reported. All primary routes open and safe.`,
        bg: 'bg-amber-50/80 border-amber-200 text-amber-950',
        dot: 'bg-amber-500',
        iconColor: 'text-amber-600',
      };
    }
    return {
      level: 'safe' as const,
      headline: 'ALL CAMPUS SECTORS CLEAR',
      badge: 'NORMAL OPERATIONAL STATE',
      description: 'Zero active hazards detected. Pathways, walkways, and buildings fully secure.',
      bg: 'bg-emerald-50/80 border-emerald-200 text-emerald-950',
      dot: 'bg-emerald-500',
      iconColor: 'text-emerald-600',
    };
  };

  const status = getSafetyStatus();

  // Chart data
  const chartData = [
    { name: 'Critical', count: criticalIncidents.length, fill: '#DC2626' },
    { name: 'High', count: highIncidents.length, fill: '#EA580C' },
    { name: 'Moderate', count: moderateIncidents.length, fill: '#D97706' },
    { name: 'Low', count: activeIncidents.filter((i) => i.severity === 'low').length, fill: '#10B981' },
  ];

  if (incidentsLoading || emergencyLoading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="h-28 bg-slate-200 animate-pulse rounded-3xl" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 h-[500px] bg-slate-200 animate-pulse rounded-3xl" />
          <div className="lg:col-span-4 h-[500px] bg-slate-200 animate-pulse rounded-3xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* 1. Hero Command Deck: Dominant Safety State Bar */}
      <div
        className={cn(
          'p-5 sm:p-6 rounded-3xl border shadow-sm transition-all duration-200 flex flex-col lg:flex-row lg:items-center justify-between gap-5',
          status.bg
        )}
      >
        <div className="flex items-start sm:items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shadow-sm border border-black/5 shrink-0">
            <Shield className={cn('w-7 h-7 stroke-[2.2]', status.iconColor)} />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={cn('w-2.5 h-2.5 rounded-full', status.dot)} />
              <h1 className="text-xl sm:text-2xl font-black tracking-tight uppercase">
                {status.headline}
              </h1>
              <span className="text-[10px] uppercase font-extrabold bg-white/80 px-2 py-0.5 rounded-md border border-black/10 font-mono">
                {status.badge}
              </span>
            </div>
            <p className="text-xs sm:text-sm font-medium text-slate-700 max-w-2xl leading-snug">
              {status.description}
            </p>
          </div>
        </div>

        {/* Quick Command Actions in Header */}
        <div className="flex items-center gap-2 shrink-0 self-end lg:self-center">
          <Link to="/routes">
            <Button
              variant="dark"
              size="sm"
              leftIcon={<Compass className="w-4 h-4 text-brand-300 mr-1" />}
            >
              Plan Safe Route
            </Button>
          </Link>
          <Link to="/incidents/new">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Sparkles className="w-4 h-4 text-brand-200 mr-1" />}
            >
              Report Incident
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Main Spatial Intelligence Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (8 cols): Prominent Live Campus Map + Analytics */}
        <div className="lg:col-span-8 space-y-6">
          {/* Main Map Canvas */}
          <div className="bg-white rounded-3xl p-1.5 border border-slate-200/90 shadow-sm overflow-hidden">
            <div className="p-3.5 flex items-center justify-between border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-brand-600 animate-pulse" />
                <h2 className="text-sm font-extrabold text-slate-900 tracking-tight">
                  Live Spatial Intelligence Map
                </h2>
                <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded">
                  Spatial Engine Active
                </span>
              </div>
              <Link
                to="/map"
                className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
              >
                Full Command View <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="h-[460px] rounded-2xl overflow-hidden relative">
              <CampusMap showRoutePanel={false} showDestinationSelector={false} />
            </div>
          </div>

          {/* Under-Map KPIs and Hotspot Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Active Hazards
              </span>
              <p className="text-2xl font-black text-slate-900 mt-1 font-mono">
                {activeIncidents.length}
              </p>
              <span className="text-[10px] text-slate-500">Live perimeters</span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Resolved Today
              </span>
              <p className="text-2xl font-black text-emerald-600 mt-1 font-mono">
                {resolvedIncidents.length}
              </p>
              <span className="text-[10px] text-slate-500">Cases cleared</span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Emergency Points
              </span>
              <p className="text-2xl font-black text-brand-600 mt-1 font-mono">
                {emergencyLocations?.length || 0}
              </p>
              <span className="text-[10px] text-slate-500">24/7 Security</span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Patrol Dispatch
              </span>
              <p className="text-2xl font-black text-purple-600 mt-1 font-mono">
                &lt; 8m
              </p>
              <span className="text-[10px] text-slate-500">Average ETA</span>
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): Live Incident Telemetry & Emergency Hub */}
        <div className="lg:col-span-4 space-y-6">
          {/* Live Incident Stream */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
                  Incident Telemetry Stream
                </h3>
                <p className="text-[11px] text-slate-400">Real-time student & officer logs</p>
              </div>
              <Link
                to="/incidents"
                className="text-xs font-bold text-brand-600 hover:underline"
              >
                Feed ({incidents.length})
              </Link>
            </div>

            {incidents.length === 0 ? (
              <div className="py-10 text-center text-slate-400 space-y-2">
                <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500" />
                <p className="text-xs font-bold text-slate-700">No active incidents</p>
                <p className="text-[11px]">All campus sectors fully nominal.</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1 divide-y divide-slate-50">
                {incidents.slice(0, 6).map((incident: Incident) => {
                  let timeAgo = '';
                  try {
                    timeAgo = formatDistanceToNow(new Date(incident.created_at), {
                      addSuffix: true,
                    });
                  } catch {
                    timeAgo = 'Recently';
                  }

                  return (
                    <div
                      key={incident.id}
                      onClick={() => setSelectedIncident(incident)}
                      className="pt-2.5 first:pt-0 cursor-pointer group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-bold text-slate-900 group-hover:text-brand-600 transition-colors line-clamp-1">
                          {incident.title}
                        </span>
                        <StatusBadge severity={incident.severity} />
                      </div>

                      <div className="flex items-center justify-between mt-1 text-[10px] text-slate-500 font-medium">
                        <span className="truncate max-w-[140px]">
                          📍 {incident.location_name || 'Campus Grounds'}
                        </span>
                        <span className="font-mono text-slate-400">{timeAgo}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 24/7 Emergency Safe Havens Direct Access */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                24/7 Campus Safe Havens
              </span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Active
              </span>
            </div>

            <div className="space-y-2">
              {emergencyLocations?.slice(0, 3).map((loc) => (
                <div
                  key={loc.id}
                  className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-2 text-xs"
                >
                  <div>
                    <p className="font-bold text-slate-900">{loc.name}</p>
                    <p className="text-[10px] text-slate-400 capitalize">
                      {loc.type.replace(/_/g, ' ')} Station
                    </p>
                  </div>

                  {loc.phone && (
                    <a
                      href={`tel:${loc.phone}`}
                      className="p-2 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200/60 font-mono text-xs font-bold flex items-center gap-1 transition-colors"
                      title="Call Station"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>{loc.phone}</span>
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Contextual Drawer for in-situ incident inspection */}
      {selectedIncident && (
        <ContextDrawer
          isOpen={!!selectedIncident}
          onClose={() => setSelectedIncident(null)}
          title={selectedIncident.title}
          subtitle={`Case #${selectedIncident.id.slice(0, 8)} • ${getIncidentTypeLabel(
            selectedIncident.incident_type
          )}`}
        >
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <StatusBadge severity={selectedIncident.severity} />
              <StatusBadge status={selectedIncident.status} />
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                Narrative
              </span>
              <p className="text-slate-700 leading-relaxed">
                {selectedIncident.description || 'No additional narrative recorded.'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-slate-600">
              <div className="p-2 bg-slate-50 rounded-lg">
                <span className="text-[10px] text-slate-400 block font-semibold">Location</span>
                <span className="font-bold text-slate-800">
                  {selectedIncident.location_name || 'Campus Grounds'}
                </span>
              </div>
              <div className="p-2 bg-slate-50 rounded-lg">
                <span className="text-[10px] text-slate-400 block font-semibold">GPS Fix</span>
                <span className="font-mono text-slate-800">
                  {selectedIncident.latitude.toFixed(4)}, {selectedIncident.longitude.toFixed(4)}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex gap-2">
              <Button
                variant="primary"
                size="sm"
                className="flex-1"
                onClick={() => {
                  setSelectedOrigin({
                    lat: selectedIncident.latitude + 0.0006,
                    lng: selectedIncident.longitude + 0.0006,
                    name: `Detour Point near ${selectedIncident.location_name || 'Hazard'}`,
                  });
                  setShowRoute(true);
                  navigate('/routes');
                }}
              >
                Plan Safe Detour
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate(`/incidents/${selectedIncident.id}`)}
              >
                Full Docket
              </Button>
            </div>
          </div>
        </ContextDrawer>
      )}
    </div>
  );
}
