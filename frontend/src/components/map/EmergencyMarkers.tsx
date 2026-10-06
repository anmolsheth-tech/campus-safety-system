import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import type { EmergencyLocation } from '@/types';
import { useMapStore } from '@/stores/mapStore';
import { Phone, Shield, Navigation } from 'lucide-react';

interface EmergencyMarkersProps {
  locations: EmergencyLocation[];
}

function getEmergencyConfig(type: string) {
  switch (type) {
    case 'hospital':
    case 'first_aid':
      return {
        bg: 'bg-rose-600',
        ring: 'ring-rose-400',
        label: 'Medical Centre / First Aid',
        icon: `<svg class="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 6v12m-6-6h12"/></svg>`,
      };
    case 'police':
      return {
        bg: 'bg-blue-700',
        ring: 'ring-blue-400',
        label: 'Campus Security / Police',
        icon: `<svg class="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
      };
    case 'fire_station':
      return {
        bg: 'bg-red-600',
        ring: 'ring-red-400',
        label: 'Fire Department Outpost',
        icon: `<svg class="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>`,
      };
    case 'emergency_phone':
      return {
        bg: 'bg-cyan-600',
        ring: 'ring-cyan-400',
        label: 'Blue Light Emergency Phone',
        icon: `<svg class="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`,
      };
    case 'safe_zone':
    default:
      return {
        bg: 'bg-emerald-600',
        ring: 'ring-emerald-400',
        label: 'Designated Safe Zone',
        icon: `<svg class="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>`,
      };
  }
}

function createEmergencyIcon(type: string) {
  const config = getEmergencyConfig(type);
  const html = `
    <div class="relative flex items-center justify-center cursor-pointer group">
      <div class="absolute w-9 h-9 rounded-full ${config.bg} opacity-20 animate-ping"></div>
      <div class="relative w-8 h-8 ${config.bg} rounded-full flex items-center justify-center shadow-lg border-2 border-white ring-2 ${config.ring} transition-transform group-hover:scale-110">
        ${config.icon}
      </div>
    </div>
  `;

  return L.divIcon({
    className: 'custom-emergency-marker',
    html,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
}

export default function EmergencyMarkers({ locations }: EmergencyMarkersProps) {
  const { setSelectedDestination, setShowRoute } = useMapStore();

  return (
    <>
      {locations.map((loc) => {
        const config = getEmergencyConfig(loc.type);
        const icon = createEmergencyIcon(loc.type);

        return (
          <Marker
            key={loc.id}
            position={[loc.latitude, loc.longitude]}
            icon={icon}
          >
            <Popup>
              <div className="min-w-[210px] p-0.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                    {loc.is_24_7 ? '24/7 Active Station' : 'Emergency Station'}
                  </span>
                </div>

                <h3 className="font-bold text-sm text-slate-900 mt-1.5 leading-snug">
                  {loc.name}
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">{config.label}</p>

                {loc.phone && (
                  <div className="mt-2 text-xs flex items-center gap-1.5 text-slate-700 bg-slate-50 p-1.5 rounded border border-slate-100">
                    <span className="text-primary-600 font-bold">📞</span>
                    <a href={`tel:${loc.phone}`} className="font-semibold text-primary-600 hover:underline">
                      {loc.phone}
                    </a>
                  </div>
                )}

                <div className="mt-3 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setSelectedDestination({
                        lat: loc.latitude,
                        lng: loc.longitude,
                        name: loc.name,
                      });
                      setShowRoute(true);
                    }}
                    className="w-full py-1.5 px-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span>🛡️</span> Route to Safe Haven
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
