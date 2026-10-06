import { Polyline, Tooltip, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useMapStore } from '@/stores/mapStore';
import { useEffect, useState } from 'react';
import { useCompareRoutes } from '@/hooks/useRoute';
import type { RouteResponse } from '@/types';
import { getRiskLevelColor, formatDistance, formatTime } from '@/utils';

const originIcon = L.divIcon({
  className: 'route-origin-marker',
  html: `
    <div class="relative flex items-center justify-center">
      <div class="absolute w-7 h-7 rounded-full bg-blue-400 opacity-40 animate-ping"></div>
      <div class="w-6 h-6 rounded-full bg-blue-600 border-2 border-white shadow-lg flex items-center justify-center text-white text-xs font-bold">
        A
      </div>
    </div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const destIcon = L.divIcon({
  className: 'route-dest-marker',
  html: `
    <div class="relative flex items-center justify-center">
      <div class="absolute w-8 h-8 rounded-full bg-red-400 opacity-40 animate-ping"></div>
      <div class="w-7 h-7 rounded-full bg-red-600 border-2 border-white shadow-lg flex items-center justify-center text-white text-xs font-bold">
        B
      </div>
    </div>
  `,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

export default function RouteLayer() {
  const {
    userLocation,
    selectedOrigin,
    selectedDestination,
    routeType,
    setRouteType,
    layers,
  } = useMapStore();

  const compareRoutes = useCompareRoutes();
  const [routes, setRoutes] = useState<{
    shortest?: RouteResponse;
    safest?: RouteResponse;
    recommended?: RouteResponse;
  }>({});

  const origin = selectedOrigin || userLocation;

  useEffect(() => {
    if (origin && selectedDestination) {
      compareRoutes
        .mutateAsync({
          origin_lat: origin.lat,
          origin_lon: origin.lng,
          dest_lat: selectedDestination.lat,
          dest_lon: selectedDestination.lng,
        })
        .then((data) => {
          setRoutes({
            shortest: data.shortest,
            safest: data.safest,
            recommended: data.recommended,
          });
        })
        .catch((err) => {
          console.error('Failed to load route comparison:', err);
        });
    }
  }, [origin?.lat, origin?.lng, selectedDestination?.lat, selectedDestination?.lng]);

  const displayRoute = routes[routeType];
  const showComparisons = layers.showComparisonRoutes;

  if (!displayRoute?.path_coordinates?.length && !routes.safest?.path_coordinates?.length) {
    return null;
  }

  return (
    <>
      {/* 1. Safest Route (Background / Alternative if not active) */}
      {showComparisons && routes.safest && routeType !== 'safest' && (
        <Polyline
          positions={routes.safest.path_coordinates}
          pathOptions={{
            color: '#10B981', // Emerald
            weight: 5,
            opacity: 0.6,
            dashArray: '6 6',
          }}
          eventHandlers={{
            click: () => setRouteType('safest'),
          }}
        >
          <Tooltip sticky>
            <div className="text-xs font-medium">
              <span className="text-emerald-700 font-bold">🛡️ Safest Route</span>
              <p className="text-[10px] text-slate-500">
                {formatDistance(routes.safest.total_distance)} • {formatTime(routes.safest.total_time)} • Risk:{' '}
                {(routes.safest.risk_score * 100).toFixed(0)}%
              </p>
              <p className="text-[9px] text-primary-600 font-semibold mt-0.5">Click to select</p>
            </div>
          </Tooltip>
        </Polyline>
      )}

      {/* 2. Shortest Route (Background / Alternative if not active) */}
      {showComparisons && routes.shortest && routeType !== 'shortest' && (
        <Polyline
          positions={routes.shortest.path_coordinates}
          pathOptions={{
            color: routes.shortest.risk_score >= 0.5 ? '#EF4444' : '#3B82F6', // Red warning if risky, Blue if fine
            weight: 4.5,
            opacity: 0.55,
            dashArray: '3 6',
          }}
          eventHandlers={{
            click: () => setRouteType('shortest'),
          }}
        >
          <Tooltip sticky>
            <div className="text-xs font-medium">
              <span className={routes.shortest.risk_score >= 0.5 ? 'text-red-600 font-bold' : 'text-blue-600 font-bold'}>
                ⚡ Shortest Route {routes.shortest.risk_score >= 0.5 && '(Higher Risk)'}
              </span>
              <p className="text-[10px] text-slate-500">
                {formatDistance(routes.shortest.total_distance)} • {formatTime(routes.shortest.total_time)} • Risk:{' '}
                {(routes.shortest.risk_score * 100).toFixed(0)}%
              </p>
              <p className="text-[9px] text-primary-600 font-semibold mt-0.5">Click to select</p>
            </div>
          </Tooltip>
        </Polyline>
      )}

      {/* 3. Recommended Route (Background / Alternative if not active) */}
      {showComparisons && routes.recommended && routeType !== 'recommended' && (
        <Polyline
          positions={routes.recommended.path_coordinates}
          pathOptions={{
            color: '#6366F1', // Indigo
            weight: 5,
            opacity: 0.6,
            dashArray: '8 6',
          }}
          eventHandlers={{
            click: () => setRouteType('recommended'),
          }}
        >
          <Tooltip sticky>
            <div className="text-xs font-medium">
              <span className="text-indigo-600 font-bold">✨ Recommended (A*)</span>
              <p className="text-[10px] text-slate-500">
                {formatDistance(routes.recommended.total_distance)} • {formatTime(routes.recommended.total_time)} • Risk:{' '}
                {(routes.recommended.risk_score * 100).toFixed(0)}%
              </p>
              <p className="text-[9px] text-primary-600 font-semibold mt-0.5">Click to select</p>
            </div>
          </Tooltip>
        </Polyline>
      )}

      {/* 4. Active Selected Route (Foreground Solid Polyline) */}
      {displayRoute?.path_coordinates && (
        <>
          {/* Subtle glow underlay */}
          <Polyline
            positions={displayRoute.path_coordinates}
            pathOptions={{
              color: getRiskLevelColor(displayRoute.risk_level),
              weight: 10,
              opacity: 0.25,
            }}
          />
          {/* Main solid path */}
          <Polyline
            positions={displayRoute.path_coordinates}
            pathOptions={{
              color: getRiskLevelColor(displayRoute.risk_level),
              weight: 6,
              opacity: 0.95,
            }}
          >
            <Tooltip sticky>
              <div className="text-xs font-semibold p-1">
                <span className="capitalize text-slate-900 font-bold">
                  {routeType} Route (Active)
                </span>
                <div className="flex items-center gap-2 mt-1 text-slate-600 font-normal">
                  <span>📏 {formatDistance(displayRoute.total_distance)}</span>
                  <span>⏱️ {formatTime(displayRoute.total_time)}</span>
                  <span className="font-semibold text-primary-700">
                    🛡️ Risk: {(displayRoute.risk_score * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </Tooltip>
          </Polyline>
        </>
      )}

      {/* 5. Start Origin Marker */}
      {origin && (
        <Marker position={[origin.lat, origin.lng]} icon={originIcon}>
          <Popup>
            <div className="text-xs p-1 font-medium">
              <span className="text-blue-700 font-bold">🚩 Starting Location</span>
              <p className="text-slate-600 mt-0.5">{'name' in origin ? (origin as any).name : 'Current GPS Origin'}</p>
            </div>
          </Popup>
        </Marker>
      )}

      {/* 6. Destination Marker */}
      {selectedDestination && (
        <Marker position={[selectedDestination.lat, selectedDestination.lng]} icon={destIcon}>
          <Popup>
            <div className="text-xs p-1 font-medium">
              <span className="text-red-700 font-bold">🏁 Destination</span>
              <p className="text-slate-600 mt-0.5">{selectedDestination.name}</p>
            </div>
          </Popup>
        </Marker>
      )}
    </>
  );
}
