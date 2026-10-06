import { useState } from 'react';
import { CampusMap } from '@/components/map';
import { useMapStore } from '@/stores/mapStore';
import {
  Route,
  MapPin,
  Navigation,
  Shield,
  AlertTriangle,
  Sparkles,
  Clock,
  ArrowRight,
  ShieldCheck,
  Building,
  Radio,
} from 'lucide-react';
import { Card, Button, StatusBadge, Badge, ContextDrawer } from '@/components/ui';
import { useIncidents } from '@/hooks/useIncidents';
import { useBuildings } from '@/hooks/useCampus';
import { formatDistance, formatTime, getIncidentTypeLabel, cn } from '@/utils';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import type { Incident, Building as BuildingType } from '@/types';

export default function MapPage() {
  const {
    selectedDestination,
    selectedOrigin,
    userLocation,
    showRoute,
    setShowRoute,
    routeType,
    setRouteType,
    setSelectedDestination,
    setSelectedOrigin,
  } = useMapStore();

  const { data: incidentsData } = useIncidents({ per_page: 50 });
  const { data: buildings } = useBuildings();
  const navigate = useNavigate();

  const [inspectingIncident, setInspectingIncident] = useState<Incident | null>(null);
  const [inspectingBuilding, setInspectingBuilding] = useState<BuildingType | null>(null);

  const incidents = incidentsData?.items || [];
  const activeIncidents = incidents.filter(
    (i) => i.status !== 'resolved' && i.status !== 'rejected'
  );

  return (
    <div className="h-[calc(100vh-7.5rem)] -m-4 sm:-m-6 lg:-m-8 flex flex-col lg:flex-row overflow-hidden relative">
      {/* 1. Main Interactive Map Surface */}
      <div className="flex-1 relative h-full w-full">
        <CampusMap showRoutePanel={false} showDestinationSelector={true} />
      </div>

      {/* 2. Floating Spatial Intelligence Dock */}
      <div className="w-full lg:w-96 bg-white border-t lg:border-t-0 lg:border-l border-slate-200/90 flex flex-col h-72 lg:h-full z-20 shadow-xl lg:shadow-none overflow-y-auto">
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-md z-10">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-brand-600 animate-pulse" />
            <h2 className="text-sm font-extrabold text-slate-900 tracking-tight">
              Spatial Intelligence
            </h2>
          </div>
          <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full font-mono">
            {activeIncidents.length} Hazards Active
          </span>
        </div>

        <div className="p-4 space-y-4">
          {/* Active Target Route Card if Destination Selected */}
          {selectedDestination ? (
            <div className="p-4 rounded-2xl bg-brand-50/60 border border-brand-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-700">
                  Target Destination
                </span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  A* Hazard Avoidance
                </span>
              </div>

              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                <span className="text-sm font-bold text-slate-900 truncate">
                  {selectedDestination.name}
                </span>
              </div>

              {/* Route Type Tabs */}
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-xs">
                  {(['recommended', 'safest', 'shortest'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => {
                        setRouteType(type);
                        setShowRoute(true);
                      }}
                      className={cn(
                        'py-1.5 px-2 rounded-lg text-xs font-bold capitalize transition-all',
                        routeType === type && showRoute
                          ? 'bg-brand-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      )}
                    >
                      {type}
                    </button>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => setShowRoute(!showRoute)}
                    variant={showRoute ? 'primary' : 'secondary'}
                    className="flex-1 text-xs"
                    size="sm"
                  >
                    <Route className="w-3.5 h-3.5 mr-1" />
                    {showRoute ? 'Hide Path' : 'Show Path'}
                  </Button>
                  <Button
                    onClick={() => navigate('/routes')}
                    variant="dark"
                    className="flex-1 text-xs"
                    size="sm"
                  >
                    <Navigation className="w-3.5 h-3.5 mr-1" />
                    Detailed Turn Steps
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-center space-y-1.5">
              <MapPin className="w-6 h-6 text-brand-500 mx-auto opacity-75" />
              <p className="text-xs font-bold text-slate-800">No Destination Selected</p>
              <p className="text-[11px] text-slate-500 leading-tight">
                Click any building icon on the map or use the top-left search bar to calculate a safe route.
              </p>
            </div>
          )}

          {/* Active Hazards Triage Feed */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700">Active Campus Hazards</span>
              <button
                onClick={() => navigate('/incidents')}
                className="text-[11px] font-semibold text-brand-600 hover:underline"
              >
                View Feed
              </button>
            </div>

            {activeIncidents.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center">No active hazards</p>
            ) : (
              <div className="space-y-2">
                {activeIncidents.slice(0, 5).map((inc) => {
                  let timeAgo = '';
                  try {
                    timeAgo = formatDistanceToNow(new Date(inc.created_at), { addSuffix: true });
                  } catch {
                    timeAgo = 'Recently';
                  }

                  return (
                    <div
                      key={inc.id}
                      onClick={() => setInspectingIncident(inc)}
                      className="p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-100 cursor-pointer transition-all space-y-1 group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-bold text-slate-900 group-hover:text-brand-600 line-clamp-1">
                          {inc.title}
                        </span>
                        <StatusBadge severity={inc.severity} />
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
                        <span>{getIncidentTypeLabel(inc.incident_type)}</span>
                        <span className="font-mono">{timeAgo}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Contextual Drawer for Incident on Map */}
      {inspectingIncident && (
        <ContextDrawer
          isOpen={!!inspectingIncident}
          onClose={() => setInspectingIncident(null)}
          title={inspectingIncident.title}
          subtitle={`Case #${inspectingIncident.id.slice(0, 8)} • ${getIncidentTypeLabel(
            inspectingIncident.incident_type
          )}`}
        >
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <StatusBadge severity={inspectingIncident.severity} />
              <StatusBadge status={inspectingIncident.status} />
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                Narrative
              </span>
              <p className="text-slate-700 leading-relaxed">
                {inspectingIncident.description || 'No additional narrative recorded.'}
              </p>
            </div>

            <div className="pt-2 border-t border-slate-100 flex gap-2">
              <Button
                variant="primary"
                size="sm"
                className="flex-1"
                onClick={() => {
                  setSelectedOrigin({
                    lat: inspectingIncident.latitude + 0.0006,
                    lng: inspectingIncident.longitude + 0.0006,
                    name: `Detour Point near ${inspectingIncident.location_name || 'Hazard'}`,
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
                onClick={() => navigate(`/incidents/${inspectingIncident.id}`)}
              >
                Full Details
              </Button>
            </div>
          </div>
        </ContextDrawer>
      )}
    </div>
  );
}
