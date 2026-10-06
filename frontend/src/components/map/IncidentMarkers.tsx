import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import type { Incident } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { getSeverityDotColor, getIncidentTypeLabel } from '@/utils';
import { useNavigate } from 'react-router-dom';
import { useMapStore } from '@/stores/mapStore';

interface IncidentMarkersProps {
  incidents: Incident[];
}

function createIncidentIcon(severity: string, isResolved: boolean) {
  const isCritical = severity === 'critical';
  const isHigh = severity === 'high';
  const isModerate = severity === 'medium';

  let bgClass = 'bg-amber-500 border-amber-600';
  let rippleClass = 'bg-amber-400';
  let iconSvg = `<svg class="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>`;

  if (isResolved) {
    bgClass = 'bg-slate-400 border-slate-500 opacity-75';
    rippleClass = 'hidden';
    iconSvg = `<svg class="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>`;
  } else if (isCritical) {
    bgClass = 'bg-red-600 border-red-700';
    rippleClass = 'bg-red-500 animate-ping';
    iconSvg = `<svg class="w-3.5 h-3.5 text-white animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
  } else if (isHigh) {
    bgClass = 'bg-orange-500 border-orange-600';
    rippleClass = 'bg-orange-400 animate-pulse';
    iconSvg = `<svg class="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
  }

  const html = `
    <div class="relative flex items-center justify-center">
      ${!isResolved ? `<div class="absolute w-8 h-8 rounded-full ${rippleClass} opacity-40"></div>` : ''}
      <div class="relative w-7 h-7 ${bgClass} rounded-full flex items-center justify-center shadow-lg border-2 border-white ring-1 ring-black/10">
        ${iconSvg}
      </div>
    </div>
  `;

  return L.divIcon({
    className: 'custom-incident-marker',
    html,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });
}

export default function IncidentMarkers({ incidents }: IncidentMarkersProps) {
  const navigate = useNavigate();
  const { setSelectedOrigin, setShowRoute } = useMapStore();

  return (
    <>
      {incidents.map((incident) => {
        const isResolved = incident.status === 'resolved' || incident.status === 'rejected';
        const icon = createIncidentIcon(incident.severity, isResolved);

        let timeString = '';
        try {
          timeString = formatDistanceToNow(new Date(incident.created_at || Date.now()), {
            addSuffix: true,
          });
        } catch {
          timeString = 'Recently';
        }

        return (
          <Marker
            key={incident.id}
            position={[incident.latitude, incident.longitude]}
            icon={icon}
          >
            <Popup>
              <div className="min-w-[220px] max-w-[260px] p-0.5">
                <div className="flex items-start justify-between gap-2">
                  <span
                    className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                      incident.severity === 'critical'
                        ? 'bg-red-100 text-red-700 border border-red-200'
                        : incident.severity === 'high'
                        ? 'bg-orange-100 text-orange-700 border border-orange-200'
                        : incident.severity === 'medium'
                        ? 'bg-amber-100 text-amber-700 border border-amber-200'
                        : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                    }`}
                  >
                    {incident.severity}
                  </span>
                  <span className="text-[10px] text-slate-400">{timeString}</span>
                </div>

                <h3 className="font-semibold text-sm text-slate-900 mt-1.5 leading-snug">
                  {incident.title}
                </h3>

                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-xs text-slate-600 font-medium">
                    {getIncidentTypeLabel(incident.incident_type)}
                  </span>
                  {(incident.status === 'verified' || !!incident.verified_at) && (
                    <span className="inline-flex items-center text-[10px] font-semibold text-primary-700 bg-primary-50 px-1.5 py-0.5 rounded border border-primary-200">
                      ✓ Security Verified
                    </span>
                  )}
                </div>

                {incident.location_name && (
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                    <span className="text-slate-400">📍</span> {incident.location_name}
                  </p>
                )}

                {incident.description && (
                  <p className="text-xs text-slate-600 mt-2 line-clamp-2 bg-slate-50 p-1.5 rounded border border-slate-100">
                    {incident.description}
                  </p>
                )}

                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => navigate(`/incidents/${incident.id}`)}
                    className="text-xs text-primary-600 hover:text-primary-700 font-semibold"
                  >
                    Full Details →
                  </button>
                  <button
                    onClick={() => {
                      setSelectedOrigin({
                        lat: incident.latitude + 0.0008,
                        lng: incident.longitude + 0.0008,
                        name: 'Safe Zone near Hazard',
                      });
                      setShowRoute(true);
                      navigate('/routes');
                    }}
                    className="text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded font-medium transition-colors"
                  >
                    Plan Safe Route
                  </button>
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
}
