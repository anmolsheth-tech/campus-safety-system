import { useState } from 'react';
import { MapPin, Search, X, Navigation, Sparkles } from 'lucide-react';
import { useBuildings, useNodes } from '@/hooks/useCampus';
import { useMapStore } from '@/stores/mapStore';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/utils';

export default function DestinationSelector() {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const { data: buildings } = useBuildings();
  const { data: nodes } = useNodes();
  const { setSelectedDestination, selectedDestination, userLocation, setShowRoute } = useMapStore();
  const navigate = useNavigate();

  const allLocations = [
    ...(buildings?.map((b) => ({
      id: b.id,
      name: b.name,
      lat: b.latitude,
      lng: b.longitude,
      type: 'building',
      code: b.code,
    })) || []),
    ...(nodes
      ?.filter((n) => n.type !== 'intersection')
      .map((n) => ({
        id: n.id,
        name: n.name,
        lat: n.latitude,
        lng: n.longitude,
        type: n.type,
        code: '',
      })) || []),
  ];

  const filtered = search
    ? allLocations.filter((loc) => loc.name.toLowerCase().includes(search.toLowerCase()))
    : allLocations;

  const handleSelect = (loc: typeof allLocations[0]) => {
    setSelectedDestination({ lat: loc.lat, lng: loc.lng, name: loc.name });
    setSearch('');
    setIsOpen(false);
  };

  const handleFindRoute = () => {
    setShowRoute(true);
    navigate('/routes');
  };

  return (
    <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-floating border border-slate-200/90 overflow-hidden transition-all duration-200">
      <div className="p-2.5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-600" />
          <input
            type="text"
            placeholder="Search campus destination..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            className="w-full pl-9 pr-8 py-2 text-xs font-semibold bg-slate-50/80 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 placeholder-slate-400 text-slate-900"
          />
          {(search || selectedDestination) && (
            <button
              onClick={() => {
                setSearch('');
                setSelectedDestination(null);
                setIsOpen(false);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
              title="Clear Destination"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {selectedDestination && (
        <div className="px-3 pb-3 space-y-2 animate-in fade-in duration-150">
          <div className="flex items-center justify-between p-2 bg-brand-50/80 rounded-xl border border-brand-200/80">
            <div className="flex items-center gap-2 min-w-0">
              <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
              <span className="text-xs font-bold text-brand-900 truncate">
                {selectedDestination.name}
              </span>
            </div>
            <span className="text-[10px] font-bold text-brand-700 bg-brand-100 px-1.5 py-0.2 rounded shrink-0">
              Target
            </span>
          </div>

          <button
            onClick={handleFindRoute}
            className="w-full py-2 px-3 bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white rounded-xl text-xs font-bold shadow-sm shadow-brand-600/20 transition-all flex items-center justify-center gap-1.5 group"
          >
            <Navigation className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            <span>Calculate Safe Route</span>
          </button>
        </div>
      )}

      {isOpen && filtered.length > 0 && (
        <div className="max-h-60 overflow-y-auto border-t border-slate-100 p-1 divide-y divide-slate-50">
          {filtered.slice(0, 8).map((loc) => (
            <button
              key={loc.id}
              onClick={() => handleSelect(loc)}
              className="w-full flex items-center justify-between px-3 py-2 hover:bg-slate-50 rounded-xl text-left transition-colors group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <MapPin className="w-3.5 h-3.5 text-slate-400 group-hover:text-brand-600 shrink-0 transition-colors" />
                <div className="truncate">
                  <p className="text-xs font-bold text-slate-800 group-hover:text-brand-600 truncate transition-colors">
                    {loc.name}
                  </p>
                  <p className="text-[10px] text-slate-400 capitalize">
                    {loc.type.replace(/_/g, ' ')}
                  </p>
                </div>
              </div>
              {loc.code && (
                <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded">
                  {loc.code}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
