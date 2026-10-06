import { Outlet } from 'react-router-dom';
import { Shield, Lock, Radio, Activity } from 'lucide-react';

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Ambient background grid & glow */}
      <div className="absolute inset-0 bg-[radial-gradient(#1E293B_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
        {/* Left Side: Brand Value Proposition */}
        <div className="lg:col-span-6 text-white space-y-6 hidden lg:block pr-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-300 text-xs font-semibold">
            <Radio className="w-3.5 h-3.5 text-brand-400 animate-pulse" />
            <span>Campus Emergency & Safety Network</span>
          </div>

          <div className="space-y-2">
            <h1 className="text-4xl font-extrabold tracking-tight text-white leading-tight">
              Real-time campus security intelligence.
            </h1>
            <p className="text-slate-400 text-sm leading-relaxed">
              Navigate safely with AI dynamic hazard routing, broadcast live emergency SOS alerts, and report campus incidents with machine learning verification.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800/80">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-slate-300 text-xs font-semibold">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span>AI Risk Forecasting</span>
              </div>
              <p className="text-[11px] text-slate-500">Continuous hazard level evaluation</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-slate-300 text-xs font-semibold">
                <Shield className="w-4 h-4 text-brand-400" />
                <span>Encrypted Telemetry</span>
              </div>
              <p className="text-[11px] text-slate-500">Direct campus police dispatch</p>
            </div>
          </div>
        </div>

        {/* Right Side: Auth Card */}
        <div className="lg:col-span-6 w-full max-w-md mx-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 p-6 sm:p-8">
            <div className="flex items-center justify-center gap-2.5 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-brand-600 flex items-center justify-center shadow-md shadow-brand-500/20">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-black text-slate-900 tracking-tight">
                CampusSafe
              </span>
            </div>

            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
