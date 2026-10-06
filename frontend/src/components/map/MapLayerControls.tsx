import { useState } from 'react';
import { useMapStore } from '@/stores/mapStore';
import { Layers, Flame, AlertTriangle, Building2, Shield, GitFork, Eye, EyeOff } from 'lucide-react';

export default function MapLayerControls() {
  const [isOpen, setIsOpen] = useState(false);
  const { layers, toggleLayer } = useMapStore();

  const layerItems = [
    {
      key: 'showHeatmap' as const,
      label: 'Risk Heatmap',
      icon: Flame,
      color: 'text-rose-500',
      activeBg: 'bg-rose-50 border-rose-200 text-rose-800',
    },
    {
      key: 'showIncidents' as const,
      label: 'Incident Reports',
      icon: AlertTriangle,
      color: 'text-amber-500',
      activeBg: 'bg-amber-50 border-amber-200 text-amber-800',
    },
    {
      key: 'showBuildings' as const,
      label: 'Campus Buildings',
      icon: Building2,
      color: 'text-blue-500',
      activeBg: 'bg-blue-50 border-blue-200 text-blue-800',
    },
    {
      key: 'showEmergency' as const,
      label: 'Emergency Stations',
      icon: Shield,
      color: 'text-emerald-500',
      activeBg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    },
    {
      key: 'showComparisonRoutes' as const,
      label: 'Route Comparison',
      icon: GitFork,
      color: 'text-indigo-500',
      activeBg: 'bg-indigo-50 border-indigo-200 text-indigo-800',
    },
  ];

  return (
    <div className="absolute top-4 right-4 z-[1000] flex flex-col items-end">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-white/95 backdrop-blur-md px-3 py-2 rounded-xl shadow-lg border border-slate-200 hover:bg-slate-50 transition-all font-semibold text-xs text-slate-700"
        title="Toggle Map Layers"
      >
        <Layers className="w-4 h-4 text-primary-600" />
        <span>Layers</span>
        <span className="bg-primary-100 text-primary-700 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
          {Object.values(layers).filter(Boolean).length}
        </span>
      </button>

      {isOpen && (
        <div className="mt-2 w-56 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 p-2 space-y-1 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-2 py-1 flex items-center justify-between border-b border-slate-100 mb-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Map Overlays
            </span>
          </div>

          {layerItems.map((item) => {
            const Icon = item.icon;
            const isEnabled = layers[item.key];

            return (
              <button
                key={item.key}
                onClick={() => toggleLayer(item.key)}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium border transition-all ${
                  isEnabled
                    ? item.activeBg
                    : 'bg-transparent border-transparent text-slate-400 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${isEnabled ? item.color : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {isEnabled ? (
                  <Eye className="w-3.5 h-3.5 text-primary-600" />
                ) : (
                  <EyeOff className="w-3.5 h-3.5 text-slate-300" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
