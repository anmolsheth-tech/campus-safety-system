import { useState } from 'react';
import { Phone, MapPin, X, AlertTriangle, Shield, Siren, Radio, CheckCircle2 } from 'lucide-react';
import { Card, Button, Modal, ConfirmDialog, PageHeader } from '@/components/ui';
import { useMapStore } from '@/stores/mapStore';
import { useEmergencyLocations } from '@/hooks/useCampus';
import { useAuth } from '@/hooks/useAuth';
import { incidentService } from '@/services/incidentService';
import toast from 'react-hot-toast';

export default function SOSPage() {
  const [showConfirm, setShowConfirm] = useState(false);
  const [sosActive, setSosActive] = useState(false);
  const [shareLocation, setShareLocation] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const { userLocation } = useMapStore();
  const { data: emergencyLocations } = useEmergencyLocations();
  const { user } = useAuth();

  const handleSOS = async () => {
    setIsLoading(true);
    try {
      const lat = shareLocation && userLocation?.lat ? userLocation.lat : 28.6139;
      const lng = shareLocation && userLocation?.lng ? userLocation.lng : 77.2090;

      await incidentService.triggerSOS({
        latitude: lat,
        longitude: lng,
        location_name: shareLocation ? 'Student Live GPS Location' : 'Campus Center',
        description: `Emergency SOS Alert triggered by ${
          user?.full_name || 'Student'
        }. Immediate campus security and medical team dispatch requested!`,
      });

      setSosActive(true);
      setShowConfirm(false);
      toast.success('SOS Broadcast dispatched! Campus security & medical team notified.', {
        duration: 6000,
      });
    } catch {
      toast.error('Failed to dispatch SOS broadcast. Please call emergency contacts directly.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelSOS = () => {
    setSosActive(false);
    toast.success('Emergency SOS Alert deactivated.');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHeader
        title="Emergency SOS Dispatch"
        subtitle="One-touch immediate security and medical dispatch to your live GPS coordinates."
        badge={sosActive ? 'ALERT BROADCASTING' : 'READY TO DISPATCH'}
        badgeVariant={sosActive ? 'danger' : 'safe'}
      />

      {/* Main SOS Trigger Hub */}
      {sosActive ? (
        <Card className="text-center py-10 border-2 border-rose-300 bg-rose-50/60 space-y-5 animate-in fade-in duration-200">
          <div className="relative inline-flex items-center justify-center">
            <div className="absolute w-40 h-40 rounded-full bg-rose-500 opacity-25 animate-ping" />
            <div className="relative w-32 h-32 rounded-full bg-rose-600 flex items-center justify-center shadow-2xl border-4 border-white text-white">
              <Siren className="w-14 h-14 animate-pulse" />
            </div>
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-black text-rose-900 tracking-tight">
              Emergency Broadcast Active
            </h2>
            <p className="text-xs text-rose-700 max-w-md mx-auto">
              Campus Security Patrol and Paramedics have received your location and are en route. Stay where you are if safe.
            </p>
          </div>

          {shareLocation && userLocation && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 border border-rose-200 text-xs font-bold text-rose-800">
              <MapPin className="w-4 h-4 text-rose-600" />
              <span>
                Coordinates: {userLocation.lat.toFixed(5)}, {userLocation.lng.toFixed(5)}
              </span>
            </div>
          )}

          <div className="pt-2">
            <Button
              variant="secondary"
              size="md"
              onClick={handleCancelSOS}
              leftIcon={<X className="w-4 h-4" />}
            >
              Cancel Emergency Alert
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="text-center py-10 border-slate-200/80 space-y-6 shadow-md">
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Instant Campus Dispatch
            </span>
            <h3 className="text-xl font-extrabold text-slate-900">
              Press & Confirm for Immediate Help
            </h3>
          </div>

          <div className="py-2">
            <button
              onClick={() => setShowConfirm(true)}
              className="group relative w-44 h-44 mx-auto rounded-full bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white flex flex-col items-center justify-center shadow-2xl shadow-rose-600/30 transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-rose-400"
            >
              <div className="absolute inset-0 rounded-full bg-rose-500 opacity-20 animate-ping group-hover:opacity-40" />
              <Siren className="w-12 h-12 mb-1 group-hover:rotate-12 transition-transform" />
              <span className="text-3xl font-black tracking-tight">SOS</span>
              <span className="text-[10px] uppercase font-bold text-rose-200 tracking-wider">
                Tap to Alert
              </span>
            </button>
          </div>

          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Dispatches your name, phone number, and real-time GPS location directly to the campus security control room.
          </p>
        </Card>
      )}

      {/* GPS Telemetry Options */}
      <Card>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-50 border border-brand-200/60 flex items-center justify-center text-brand-600">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">
                Share Live GPS Coordinates
              </p>
              <p className="text-[11px] text-slate-500">
                Transmits continuous geolocation to responders
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={shareLocation}
              onChange={(e) => setShareLocation(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
          </label>
        </div>
      </Card>

      {/* Direct Emergency Telephone Contacts */}
      <Card>
        <div className="pb-3 border-b border-slate-100 mb-3">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Direct 24/7 Phone Lines
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              name: 'Campus Police & Security',
              num: '+1 (555) 123-4567',
              role: '24/7 Dispatch',
              color: 'text-brand-600 bg-brand-50 border-brand-200',
            },
            {
              name: 'Campus Medical Centre',
              num: '+1 (555) 123-4568',
              role: 'Urgent Care & First Aid',
              color: 'text-rose-600 bg-rose-50 border-rose-200',
            },
            {
              name: 'Emergency Services',
              num: '911',
              role: 'City Police & Fire',
              color: 'text-amber-600 bg-amber-50 border-amber-200',
            },
          ].map((c) => (
            <a
              key={c.name}
              href={`tel:${c.num.replace(/[^0-9+]/g, '')}`}
              className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 transition-all flex flex-col justify-between group"
            >
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  {c.role}
                </span>
                <span className="text-xs font-bold text-slate-900 block mt-0.5">
                  {c.name}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-200/60">
                <span className="font-mono text-xs font-bold text-slate-700">
                  {c.num}
                </span>
                <Phone className="w-3.5 h-3.5 text-brand-600 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </a>
          ))}
        </div>
      </Card>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleSOS}
        title="Broadcast Emergency SOS?"
        message="This will notify campus police and emergency medical responders with your immediate coordinates. Only trigger for active safety threats."
        confirmText="Yes, Send SOS"
        cancelText="Cancel"
        variant="danger"
        isLoading={isLoading}
      />
    </div>
  );
}
