import { useState } from 'react';
import { ChevronDown, ChevronUp, Info } from 'lucide-react';

export default function MapLegend() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="absolute bottom-4 left-4 z-[1000] bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/80 p-3 text-xs transition-all w-60">
      <div
        className="flex items-center justify-between cursor-pointer select-none"
        onClick={() => setCollapsed(!collapsed)}
      >
        <div className="flex items-center gap-1.5 font-bold text-slate-800">
          <Info className="w-3.5 h-3.5 text-primary-600" />
          <span>Map Intelligence</span>
        </div>
        <button className="text-slate-400 hover:text-slate-600">
          {collapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {!collapsed && (
        <div className="mt-3 space-y-2.5 animate-in fade-in duration-150">
          {/* Hazards & Heatmap */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Hazards & Heatmap
            </p>
            <div className="space-y-1 text-[11px]">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-600 ring-2 ring-red-300"></div>
                <span className="text-slate-700 font-medium">Critical Danger Zone (120m)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-500 ring-2 ring-orange-200"></div>
                <span className="text-slate-700 font-medium">High Risk Area (90m)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500 ring-2 ring-amber-200"></div>
                <span className="text-slate-700 font-medium">Moderate Caution Zone (65m)</span>
              </div>
            </div>
          </div>

          {/* Navigation Paths */}
          <div className="pt-2 border-t border-slate-100">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Route Types
            </p>
            <div className="space-y-1 text-[11px]">
              <div className="flex items-center gap-2">
                <div className="w-4 h-1 bg-emerald-500 rounded"></div>
                <span className="text-slate-700 font-medium">Safest Route (Lowest Risk)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-1 bg-indigo-500 rounded"></div>
                <span className="text-slate-700 font-medium">Recommended (A* Safe/Fast)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-1 bg-blue-500 rounded border-dashed"></div>
                <span className="text-slate-700 font-medium">Shortest (Direct Distance)</span>
              </div>
            </div>
          </div>

          {/* Campus Features */}
          <div className="pt-2 border-t border-slate-100">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Facilities & GPS
            </p>
            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-blue-600"></div>
                <span className="text-slate-700">Buildings</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-rose-600"></div>
                <span className="text-slate-700">Emergency</span>
              </div>
              <div className="flex items-center gap-1.5 col-span-2">
                <div className="w-3 h-3 rounded-full bg-blue-600 ring-2 ring-blue-300"></div>
                <span className="text-slate-700">Your Live GPS Beacon</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
