import { useState, useEffect } from 'react';
import {
  Navigation,
  Clock,
  Shield,
  Zap,
  AlertTriangle,
  MapPin,
  Info,
  ArrowUpDown,
  Sparkles,
  ChevronDown,
  ChevronUp,
  CornerDownRight,
  ShieldCheck,
  CheckCircle2,
  Compass,
  Layers,
} from 'lucide-react';
import { Card, Button, Select, PageHeader } from '@/components/ui';
import { CampusMap } from '@/components/map';
import { useMapStore } from '@/stores/mapStore';
import { useCompareRoutes } from '@/hooks/useRoute';
import { useBuildings } from '@/hooks/useCampus';
import { formatDistance, formatTime, getRiskLevelColor, cn } from '@/utils';
import toast from 'react-hot-toast';

export default function RoutePage() {
  const {
    selectedDestination,
    selectedOrigin,
    userLocation,
    setSelectedDestination,
    setSelectedOrigin,
    setShowRoute,
    routeType,
    setRouteType,
    swapOriginDestination,
  } = useMapStore();

  const [originBuildingId, setOriginBuildingId] = useState('current');
  const [destBuildingId, setDestBuildingId] = useState('');
  const compareRoutes = useCompareRoutes();
  const { data: buildings } = useBuildings();

  const [comparisonResult, setComparisonResult] = useState<null | {
    shortest: { distance: number; time: number; risk: string; risk_score: number };
    safest: { distance: number; time: number; risk: string; risk_score: number };
    recommended: { distance: number; time: number; risk: string; risk_score: number };
    summary?: string;
    explanation?: {
      reasons?: string[];
      shortest_comparison?: string;
      risk_factors?: string[];
      warnings?: string[];
      directions?: Array<{
        step: number;
        from: string;
        to: string;
        distance_meters: number;
        pathway: string;
        instruction: string;
      }>;
    };
  }>(null);
  const [showDirections, setShowDirections] = useState(true);

  // Initialize start/end
  useEffect(() => {
    if (!selectedOrigin && userLocation) {
      setSelectedOrigin({
        lat: userLocation.lat,
        lng: userLocation.lng,
        name: 'Campus Center (Main Gate)',
      });
    }
  }, [userLocation, selectedOrigin, setSelectedOrigin]);

  // Sync dropdowns when buildings or store change
  useEffect(() => {
    if (!buildings || buildings.length === 0) return;

    if (selectedDestination && !destBuildingId) {
      const matchingDest = buildings.find(
        (b) =>
          Math.abs(b.latitude - selectedDestination.lat) < 0.0001 &&
          Math.abs(b.longitude - selectedDestination.lng) < 0.0001
      );
      if (matchingDest) setDestBuildingId(String(matchingDest.id));
    }

    if (selectedOrigin && originBuildingId === 'current') {
      const matchingOrigin = buildings.find(
        (b) =>
          Math.abs(b.latitude - selectedOrigin.lat) < 0.0001 &&
          Math.abs(b.longitude - selectedOrigin.lng) < 0.0001
      );
      if (matchingOrigin) setOriginBuildingId(String(matchingOrigin.id));
    }
  }, [buildings, selectedDestination, selectedOrigin]);

  const handleOriginSelect = (buildingId: string) => {
    setOriginBuildingId(buildingId);
    if (buildingId === 'current') {
      const loc = userLocation || { lat: 28.6139, lng: 77.2090 };
      setSelectedOrigin({ lat: loc.lat, lng: loc.lng, name: 'Campus Center (Main Gate)' });
      return;
    }
    const building = buildings?.find((b) => String(b.id) === String(buildingId));
    if (building) {
      setSelectedOrigin({
        lat: building.latitude,
        lng: building.longitude,
        name: building.name,
      });
    }
  };

  const handleDestinationSelect = (buildingId: string) => {
    setDestBuildingId(buildingId);
    if (!buildingId) {
      setSelectedDestination(null);
      return;
    }
    const building = buildings?.find((b) => String(b.id) === String(buildingId));
    if (building) {
      setSelectedDestination({
        lat: building.latitude,
        lng: building.longitude,
        name: building.name,
      });
    }
  };

  const handleFastSelectDestination = (buildingName: string) => {
    const bldg = buildings?.find((b) => b.name.toLowerCase().includes(buildingName.toLowerCase()));
    if (bldg) {
      setDestBuildingId(String(bldg.id));
      setSelectedDestination({
        lat: bldg.latitude,
        lng: bldg.longitude,
        name: bldg.name,
      });
    }
  };

  const handleCalculateRoutes = async () => {
    const origin = selectedOrigin || userLocation;
    if (!origin || !selectedDestination) {
      toast.error('Please pick a target destination');
      return;
    }

    try {
      const res = await compareRoutes.mutateAsync({
        origin_lat: origin.lat,
        origin_lon: origin.lng,
        dest_lat: selectedDestination.lat,
        dest_lon: selectedDestination.lng,
      });

      setComparisonResult({
        shortest: {
          distance: res.shortest.total_distance,
          time: res.shortest.total_time,
          risk: res.shortest.risk_level,
          risk_score: res.shortest.risk_score,
        },
        safest: {
          distance: res.safest.total_distance,
          time: res.safest.total_time,
          risk: res.safest.risk_level,
          risk_score: res.safest.risk_score,
        },
        recommended: {
          distance: res.recommended.total_distance,
          time: res.recommended.total_time,
          risk: res.recommended.risk_level,
          risk_score: res.recommended.risk_score,
        },
        summary: res.summary,
        explanation: res.recommended.explanation || (res.safest.explanation as any),
      });

      setShowRoute(true);
      toast.success('Safe routes computed successfully!');
    } catch {
      toast.error('Could not compute path between selected coordinates');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="Safe Route Navigation Engine"
        subtitle="Real-time multi-criteria route optimization balancing physical distance against active campus hazard perimeters."
        badge="Spatial Routing Engine"
        badgeVariant="safe"
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Trip Navigation Console */}
        <div className="lg:col-span-5 space-y-5">
          {/* 1. Trip Origin / Destination Panel */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
                  Trip Waypoints
                </span>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                A* Safety Optimized
              </span>
            </div>

            {/* Waypoint Inputs with Visual Connector */}
            <div className="relative space-y-3">
              {/* Origin Field */}
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-extrabold shrink-0 mt-6 shadow-sm ring-4 ring-blue-50">
                  A
                </div>
                <div className="flex-1">
                  <Select
                    label="Starting Point (Origin)"
                    options={[
                      { value: 'current', label: '📍 My Live Location (GPS)' },
                      ...(buildings || []).map((b) => ({ value: String(b.id), label: b.name })),
                    ]}
                    value={originBuildingId}
                    onChange={(e) => handleOriginSelect(e.target.value)}
                  />
                </div>
              </div>

              {/* Swap Button */}
              <div className="flex justify-end pr-2 -my-2 relative z-10">
                <button
                  type="button"
                  onClick={swapOriginDestination}
                  className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all border border-slate-200 shadow-xs"
                  title="Swap Origin & Destination"
                >
                  <ArrowUpDown className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Destination Field */}
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-rose-600 text-white flex items-center justify-center text-xs font-extrabold shrink-0 mt-6 shadow-sm ring-4 ring-rose-50">
                  B
                </div>
                <div className="flex-1">
                  <Select
                    label="Target Destination"
                    options={[
                      { value: '', label: 'Select Target Destination...' },
                      ...(buildings || []).map((b) => ({ value: String(b.id), label: b.name })),
                    ]}
                    value={destBuildingId}
                    onChange={(e) => handleDestinationSelect(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Quick Destination Chips */}
            <div className="pt-2 border-t border-slate-100">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                Quick Select Landmarks:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { name: 'Library', label: '📚 Library' },
                  { name: 'Medical', label: '🏥 Medical Centre' },
                  { name: 'Sports', label: '⚽ Sports Complex' },
                  { name: 'Hostel', label: '🏠 Boys Hostel' },
                ].map((chip) => (
                  <button
                    key={chip.name}
                    type="button"
                    onClick={() => handleFastSelectDestination(chip.name)}
                    className="px-2.5 py-1.5 text-xs font-semibold bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl transition-colors active:scale-95"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Compute CTA Button */}
            <Button
              variant="primary"
              size="lg"
              className="w-full font-extrabold text-xs py-3.5 mt-2 shadow-md shadow-blue-600/20"
              onClick={handleCalculateRoutes}
              isLoading={compareRoutes.isPending}
              disabled={!selectedDestination}
              leftIcon={<Navigation className="w-4 h-4 mr-1" />}
            >
              {selectedDestination ? 'Calculate & Compare Safe Routes' : 'Pick a Destination Above'}
            </Button>
          </div>

          {/* 2. Route Comparison Options */}
          {comparisonResult && (
            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Available Route Options
                </span>
                <span className="text-[11px] text-slate-400">Click to switch active path</span>
              </div>

              {/* 1. Recommended (A*) */}
              <div
                onClick={() => {
                  setRouteType('recommended');
                  setShowRoute(true);
                }}
                className={cn(
                  'p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group',
                  routeType === 'recommended'
                    ? 'bg-indigo-50/80 border-indigo-300 ring-2 ring-indigo-500/20 shadow-sm'
                    : 'bg-white border-slate-200/80 hover:border-slate-300'
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-indigo-950 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                        Recommended Route (A*)
                      </span>
                      <span className="text-[9px] uppercase font-bold text-indigo-700 bg-indigo-100 px-1.5 py-0.2 rounded">
                        Balanced AI
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Minimizes walking time while fully bypassing active threat perimeters.
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold text-indigo-700 font-mono">
                      {(comparisonResult.recommended.risk_score * 100).toFixed(0)}% Risk
                    </span>
                    <span className="text-[10px] text-slate-400 block font-mono">
                      {formatTime(comparisonResult.recommended.time)}
                    </span>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-indigo-100 flex items-center justify-between text-xs text-slate-600 font-semibold">
                  <span>Distance: {formatDistance(comparisonResult.recommended.distance)}</span>
                  <span className="text-indigo-600 font-bold group-hover:underline">
                    {routeType === 'recommended' ? '● Active on Map' : 'Select This Route →'}
                  </span>
                </div>
              </div>

              {/* 2. Safest Route */}
              <div
                onClick={() => {
                  setRouteType('safest');
                  setShowRoute(true);
                }}
                className={cn(
                  'p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group',
                  routeType === 'safest'
                    ? 'bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-500/20 shadow-sm'
                    : 'bg-white border-slate-200/80 hover:border-slate-300'
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-emerald-950 flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        Safest Route
                      </span>
                      <span className="text-[9px] uppercase font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">
                        Lowest Risk
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Maximizes distance from caution zones and well-lit pathways.
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold text-emerald-700 font-mono">
                      {(comparisonResult.safest.risk_score * 100).toFixed(0)}% Risk
                    </span>
                    <span className="text-[10px] text-slate-400 block font-mono">
                      {formatTime(comparisonResult.safest.time)}
                    </span>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-emerald-100 flex items-center justify-between text-xs text-slate-600 font-semibold">
                  <span>Distance: {formatDistance(comparisonResult.safest.distance)}</span>
                  <span className="text-emerald-600 font-bold group-hover:underline">
                    {routeType === 'safest' ? '● Active on Map' : 'Select This Route →'}
                  </span>
                </div>
              </div>

              {/* 3. Shortest Route */}
              <div
                onClick={() => {
                  setRouteType('shortest');
                  setShowRoute(true);
                }}
                className={cn(
                  'p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group',
                  routeType === 'shortest'
                    ? 'bg-blue-50/80 border-blue-300 ring-2 ring-blue-500/20 shadow-sm'
                    : 'bg-white border-slate-200/80 hover:border-slate-300'
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-blue-950 flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-blue-600" />
                        Shortest Route
                      </span>
                      {comparisonResult.shortest.risk_score >= 0.5 && (
                        <span className="text-[9px] uppercase font-bold text-rose-700 bg-rose-100 px-1.5 py-0.2 rounded">
                          Elevated Risk
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Direct mathematical line. Does not avoid active incident zones.
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={cn(
                        'text-xs font-bold font-mono',
                        comparisonResult.shortest.risk_score >= 0.5
                          ? 'text-rose-600'
                          : 'text-blue-700'
                      )}
                    >
                      {(comparisonResult.shortest.risk_score * 100).toFixed(0)}% Risk
                    </span>
                    <span className="text-[10px] text-slate-400 block font-mono">
                      {formatTime(comparisonResult.shortest.time)}
                    </span>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-blue-100 flex items-center justify-between text-xs text-slate-600 font-semibold">
                  <span>Distance: {formatDistance(comparisonResult.shortest.distance)}</span>
                  <span className="text-blue-600 font-bold group-hover:underline">
                    {routeType === 'shortest' ? '● Active on Map' : 'Select This Route →'}
                  </span>
                </div>
              </div>

              {/* Turn-by-turn Navigation Waypoints Drawer */}
              {comparisonResult.explanation?.directions &&
                comparisonResult.explanation.directions.length > 0 && (
                  <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs space-y-3">
                    <div
                      className="flex items-center justify-between cursor-pointer select-none"
                      onClick={() => setShowDirections(!showDirections)}
                    >
                      <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                        <CornerDownRight className="w-4 h-4 text-blue-600" />
                        Turn-by-Turn Waypoints ({comparisonResult.explanation.directions.length})
                      </span>
                      <button className="text-slate-400 hover:text-slate-600">
                        {showDirections ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    {showDirections && (
                      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                        {comparisonResult.explanation.directions.map((d) => (
                          <div
                            key={d.step}
                            className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs flex items-start gap-2.5"
                          >
                            <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                              {d.step}
                            </span>
                            <div>
                              <p className="font-semibold text-slate-800">{d.instruction}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                {d.distance_meters}m on {d.pathway} pathway
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
            </div>
          )}
        </div>

        {/* Right Column: Full-Height Interactive Campus Map */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-3xl p-1.5 border border-slate-200 shadow-sm overflow-hidden sticky top-20">
            <div className="h-[580px] rounded-2xl overflow-hidden relative">
              <CampusMap showRoutePanel={false} showDestinationSelector={false} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
