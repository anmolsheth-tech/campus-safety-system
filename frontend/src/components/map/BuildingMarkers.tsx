import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import type { Building } from '@/types';
import { useMapStore } from '@/stores/mapStore';
import { useNavigate } from 'react-router-dom';

interface BuildingMarkersProps {
  buildings: Building[];
}

function getBuildingTypeConfig(type: string, name: string) {
  const lowerType = (type || '').toLowerCase();
  const lowerName = (name || '').toLowerCase();

  if (lowerType.includes('lib') || lowerName.includes('library')) {
    return {
      bg: 'bg-indigo-600 border-indigo-700',
      label: 'Library / Study',
      icon: `<svg class="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`,
    };
  }
  if (lowerType.includes('med') || lowerType.includes('health') || lowerName.includes('health') || lowerName.includes('medical')) {
    return {
      bg: 'bg-rose-600 border-rose-700',
      label: 'Health & Medical',
      icon: `<svg class="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 6v12m-6-6h12"/></svg>`,
    };
  }
  if (lowerType.includes('sport') || lowerType.includes('gym') || lowerName.includes('sport') || lowerName.includes('complex')) {
    return {
      bg: 'bg-emerald-600 border-emerald-700',
      label: 'Sports & Athletics',
      icon: `<svg class="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M6 12c0-3.3 2.7-6 6-6s6 2.7 6 6-2.7 6-6 6"/></svg>`,
    };
  }
  if (lowerType.includes('residen') || lowerType.includes('hostel') || lowerName.includes('hostel') || lowerName.includes('hall')) {
    return {
      bg: 'bg-purple-600 border-purple-700',
      label: 'Hostel / Residence',
      icon: `<svg class="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
    };
  }
  if (lowerType.includes('canteen') || lowerType.includes('food') || lowerType.includes('din') || lowerName.includes('canteen') || lowerName.includes('cafeteria')) {
    return {
      bg: 'bg-amber-600 border-amber-700',
      label: 'Dining & Canteen',
      icon: `<svg class="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8zM6 1v3M10 1v3M14 1v3"/></svg>`,
    };
  }
  // Default Academic / Department
  return {
    bg: 'bg-blue-600 border-blue-700',
    label: 'Academic Building',
    icon: `<svg class="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>`,
  };
}

function createBuildingDivIcon(building: Building) {
  const config = getBuildingTypeConfig(building.building_type, building.name);
  const html = `
    <div class="group relative flex items-center justify-center cursor-pointer">
      <div class="w-8 h-8 ${config.bg} rounded-xl flex items-center justify-center shadow-md border-2 border-white ring-1 ring-black/10 transition-transform group-hover:scale-110">
        ${config.icon}
      </div>
      <div class="absolute -bottom-5 bg-slate-900/80 text-white text-[10px] font-semibold px-1.5 py-0.2 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow">
        ${building.code || building.name}
      </div>
    </div>
  `;

  return L.divIcon({
    className: 'custom-building-marker',
    html,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
}

export default function BuildingMarkers({ buildings }: BuildingMarkersProps) {
  const { setSelectedDestination, setSelectedOrigin, setShowRoute } = useMapStore();
  const navigate = useNavigate();

  return (
    <>
      {buildings.map((building) => {
        const config = getBuildingTypeConfig(building.building_type, building.name);
        const icon = createBuildingDivIcon(building);

        return (
          <Marker
            key={building.id}
            position={[building.latitude, building.longitude]}
            icon={icon}
          >
            <Popup>
              <div className="min-w-[210px] max-w-[260px] p-0.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    {config.label}
                  </span>
                  <span className="text-[11px] font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                    {building.code}
                  </span>
                </div>

                <h3 className="font-bold text-sm text-slate-900 mt-1 leading-tight">
                  {building.name}
                </h3>

                <div className="mt-2 text-xs text-slate-600 space-y-1 bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <div className="flex items-center justify-between text-slate-500">
                    <span>Structure:</span>
                    <span className="font-medium text-slate-700">
                      {building.floors} Floor{building.floors > 1 ? 's' : ''}
                    </span>
                  </div>

                  <div className="pt-1 space-y-0.5 text-[11px]">
                    {building.has_security && (
                      <p className="text-emerald-700 font-semibold flex items-center gap-1">
                        <span>🛡️</span> Security Guard Post
                      </p>
                    )}
                    {building.has_aed && (
                      <p className="text-blue-700 font-semibold flex items-center gap-1">
                        <span>⚡</span> Automated Defibrillator (AED)
                      </p>
                    )}
                    {building.has_fire_extinguisher && (
                      <p className="text-red-700 font-semibold flex items-center gap-1">
                        <span>🧯</span> Fire Safety Station
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedOrigin({
                        lat: building.latitude,
                        lng: building.longitude,
                        name: building.name,
                      });
                    }}
                    className="flex-1 py-1.5 px-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors flex items-center justify-center gap-1"
                  >
                    <span>🚩</span> Start
                  </button>
                  <button
                    onClick={() => {
                      setSelectedDestination({
                        lat: building.latitude,
                        lng: building.longitude,
                        name: building.name,
                      });
                      setShowRoute(true);
                    }}
                    className="flex-1 py-1.5 px-2 text-xs font-semibold bg-primary-600 hover:bg-primary-700 text-white rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1"
                  >
                    <span>🎯</span> Route Here
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
