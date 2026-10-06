import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Flame,
  ShieldAlert,
  AlertTriangle,
  Heart,
  Building,
  Bug,
  HelpCircle,
  Siren,
  Hand,
  Sparkles,
  MapPin,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
} from 'lucide-react';
import { Button, Card, Input, Select, PageHeader } from '@/components/ui';
import { useCreateIncident } from '@/hooks/useIncidents';
import { useMapStore } from '@/stores/mapStore';
import { useBuildings } from '@/hooks/useCampus';
import { incidentService } from '@/services/incidentService';
import { IncidentType, Severity } from '@/types';
import { cn, getIncidentTypeLabel } from '@/utils';
import toast from 'react-hot-toast';

const steps = ['Category', 'Severity', 'Narrative', 'Location', 'Review'];

const incidentCategories: Array<{
  type: IncidentType;
  label: string;
  desc: string;
  icon: React.ReactNode;
}> = [
  {
    type: IncidentType.HARASSMENT,
    label: 'Harassment / Stalking',
    desc: 'Unwanted behavior or threats',
    icon: <Hand className="w-5 h-5 text-purple-600" />,
  },
  {
    type: IncidentType.THEFT,
    label: 'Theft / Burglary',
    desc: 'Stolen personal or campus property',
    icon: <ShieldAlert className="w-5 h-5 text-blue-600" />,
  },
  {
    type: IncidentType.ASSAULT,
    label: 'Assault / Violence',
    desc: 'Physical altercations or threats',
    icon: <Siren className="w-5 h-5 text-rose-600" />,
  },
  {
    type: IncidentType.MEDICAL,
    label: 'Medical Emergency',
    desc: 'Injury, collapse, or urgent health need',
    icon: <Heart className="w-5 h-5 text-rose-500" />,
  },
  {
    type: IncidentType.FIRE,
    label: 'Fire / Chemical Hazard',
    desc: 'Smoke, flames, gas leak',
    icon: <Flame className="w-5 h-5 text-orange-500" />,
  },
  {
    type: IncidentType.STRUCTURAL,
    label: 'Structural / Lighting Hazard',
    desc: 'Broken walkways, dark paths, outages',
    icon: <Building className="w-5 h-5 text-amber-600" />,
  },
  {
    type: IncidentType.SUSPICIOUS_ACTIVITY,
    label: 'Suspicious Activity',
    desc: 'Unusual behavior, prowlers',
    icon: <AlertTriangle className="w-5 h-5 text-amber-500" />,
  },
  {
    type: IncidentType.VANDALISM,
    label: 'Vandalism / Damage',
    desc: 'Property destruction or graffiti',
    icon: <Bug className="w-5 h-5 text-slate-600" />,
  },
  {
    type: IncidentType.OTHER,
    label: 'Other Incident',
    desc: 'General campus safety concern',
    icon: <HelpCircle className="w-5 h-5 text-slate-500" />,
  },
];

const severityLevels = [
  {
    level: Severity.LOW,
    label: 'Low Priority',
    desc: 'Minor concern, zero immediate physical risk',
    border: 'border-emerald-300 bg-emerald-50/50 text-emerald-900',
    tag: 'bg-emerald-100 text-emerald-700',
  },
  {
    level: Severity.MEDIUM,
    label: 'Moderate Priority',
    desc: 'Notable hazard or disturbance, needs attention',
    border: 'border-amber-300 bg-amber-50/50 text-amber-900',
    tag: 'bg-amber-100 text-amber-700',
  },
  {
    level: Severity.HIGH,
    label: 'High Priority',
    desc: 'Significant risk, potential for imminent danger',
    border: 'border-orange-300 bg-orange-50/50 text-orange-900',
    tag: 'bg-orange-100 text-orange-700',
  },
  {
    level: Severity.CRITICAL,
    label: 'Critical Emergency',
    desc: 'Severe immediate threat, requires emergency dispatch',
    border: 'border-rose-400 bg-rose-100/60 text-rose-900 ring-1 ring-rose-400',
    tag: 'bg-rose-200 text-rose-800',
  },
];

export default function IncidentReportPage() {
  const [step, setStep] = useState(0);
  const [incidentType, setIncidentType] = useState<IncidentType | ''>('');
  const [severity, setSeverity] = useState<Severity | ''>('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [locationName, setLocationName] = useState('');
  const [building, setBuilding] = useState('');
  const { userLocation } = useMapStore();
  const { data: buildings } = useBuildings();
  const [latitude, setLatitude] = useState(userLocation?.lat || 28.6139);
  const [longitude, setLongitude] = useState(userLocation?.lng || 77.2090);

  const [aiPrediction, setAiPrediction] = useState<{
    recommended_severity: string;
    confidence: number;
    probabilities: Record<string, number>;
    factors: string[];
  } | null>(null);
  const [isPredicting, setIsPredicting] = useState(false);

  const createIncident = useCreateIncident();
  const navigate = useNavigate();

  // Trigger ML severity classifier on title/description change
  useEffect(() => {
    if (!incidentType && !description.trim()) return;

    const timer = setTimeout(async () => {
      setIsPredicting(true);
      try {
        const pred = await incidentService.predictSeverity({
          incident_type: incidentType || 'other',
          description: `${title} ${description}`.trim(),
          latitude,
          longitude,
        });
        setAiPrediction(pred);
      } catch (err) {
        console.error('ML Severity Classifier error:', err);
      } finally {
        setIsPredicting(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [incidentType, title, description, latitude, longitude]);

  const applyAiSeverity = () => {
    if (aiPrediction?.recommended_severity) {
      const mapped =
        aiPrediction.recommended_severity === 'moderate'
          ? Severity.MEDIUM
          : (aiPrediction.recommended_severity as Severity);
      setSeverity(mapped);
      toast.success(`Applied AI recommendation: ${mapped.toUpperCase()}`);
    }
  };

  const handleBuildingChange = (bldgName: string) => {
    setBuilding(bldgName);
    const found = buildings?.find((b) => b.name === bldgName);
    if (found) {
      setLatitude(found.latitude);
      setLongitude(found.longitude);
      if (!locationName) setLocationName(found.name);
    }
  };

  const canNext = () => {
    if (step === 0) return !!incidentType;
    if (step === 1) return !!severity;
    if (step === 2) return !!title.trim() && !!description.trim();
    return true;
  };

  const handleSubmit = async () => {
    if (!incidentType || !severity) return;
    try {
      await createIncident.mutateAsync({
        title,
        description,
        incident_type: incidentType,
        severity,
        latitude,
        longitude,
        location_name: locationName || undefined,
        building: building || undefined,
      });
      toast.success('Incident reported successfully! Safety routing updated.');
      navigate('/incidents');
    } catch {
      toast.error('Failed to submit incident report');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHeader
        title="Report Safety Incident"
        subtitle="Log an incident into the campus intelligence network. Real-time routing will avoid this area."
        badge={`Step ${step + 1} of 5`}
        badgeVariant="info"
      />

      {/* Progress Bar Indicator */}
      <div className="flex items-center gap-1.5">
        {steps.map((s, idx) => (
          <div key={s} className="flex-1">
            <div
              className={cn(
                'h-1.5 rounded-full transition-all duration-200',
                idx < step
                  ? 'bg-emerald-500'
                  : idx === step
                  ? 'bg-brand-600'
                  : 'bg-slate-200'
              )}
            />
            <span
              className={cn(
                'text-[10px] font-bold block mt-1 uppercase tracking-wider',
                idx === step ? 'text-slate-900' : 'text-slate-400'
              )}
            >
              {s}
            </span>
          </div>
        ))}
      </div>

      {/* Step 1: Category Selection */}
      {step === 0 && (
        <Card className="space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              What type of incident occurred?
            </h3>
            <p className="text-xs text-slate-500">
              Select the category that best matches what you observed
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {incidentCategories.map((cat) => (
              <button
                key={cat.type}
                type="button"
                onClick={() => setIncidentType(cat.type)}
                className={cn(
                  'p-4 rounded-2xl border text-left transition-all duration-150 flex flex-col justify-between group',
                  incidentType === cat.type
                    ? 'border-brand-600 bg-brand-50/60 ring-2 ring-brand-500/20 shadow-xs'
                    : 'border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                )}
              >
                <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  {cat.icon}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 leading-snug">
                    {cat.label}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{cat.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* Step 2: Severity Selection with AI Live Assistance */}
      {step === 1 && (
        <Card className="space-y-5">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Select Hazard Severity Level
            </h3>
            <p className="text-xs text-slate-500">
              Indicates urgency for security response and safe route avoidance radii
            </p>
          </div>

          {/* AI Machine Learning Severity Suggestion */}
          {aiPrediction && (
            <div className="p-4 rounded-2xl bg-brand-50/70 border border-brand-200 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-sm">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-brand-900">
                      AI Severity Classification:
                    </span>
                    <span className="text-xs font-extrabold uppercase text-brand-700 bg-brand-100 px-2 py-0.5 rounded">
                      {aiPrediction.recommended_severity}
                    </span>
                  </div>
                  <p className="text-[11px] text-brand-700/80">
                    Confidence: {(aiPrediction.confidence * 100).toFixed(0)}% • ML Natural Language Analysis
                  </p>
                </div>
              </div>

              <Button
                variant="dark"
                size="xs"
                onClick={applyAiSeverity}
                className="shrink-0 text-xs"
              >
                Apply Suggestion
              </Button>
            </div>
          )}

          <div className="space-y-2.5">
            {severityLevels.map((lvl) => (
              <button
                key={lvl.level}
                type="button"
                onClick={() => setSeverity(lvl.level)}
                className={cn(
                  'w-full p-4 rounded-2xl border text-left transition-all duration-150 flex items-center justify-between',
                  severity === lvl.level
                    ? `${lvl.border} shadow-xs`
                    : 'border-slate-200/80 bg-white hover:border-slate-300'
                )}
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">
                      {lvl.label}
                    </span>
                    <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded', lvl.tag)}>
                      {lvl.level.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">{lvl.desc}</p>
                </div>

                {severity === lvl.level && (
                  <CheckCircle2 className="w-5 h-5 text-brand-600 shrink-0" />
                )}
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* Step 3: Narrative & Description */}
      {step === 2 && (
        <Card className="space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Incident Details & Narrative
            </h3>
            <p className="text-xs text-slate-500">
              Provide clear information so campus responders can act swiftly
            </p>
          </div>

          <Input
            label="Incident Headline / Summary"
            placeholder="e.g. Broken street lamp near North Lawn creating dark spot"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">
              Detailed Narrative
            </label>
            <textarea
              rows={4}
              placeholder="Describe what occurred, any hazards, people involved, or current conditions..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              required
            />
          </div>
        </Card>
      )}

      {/* Step 4: Campus Location & Landmark */}
      {step === 3 && (
        <Card className="space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Location on Campus
            </h3>
            <p className="text-xs text-slate-500">
              Pinpoint the building or landmark where the hazard is located
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">
                Nearest Campus Building
              </label>
              <Select
                options={[
                  { value: '', label: 'Select Building (Optional)' },
                  ...(buildings || []).map((b) => ({ value: b.name, label: b.name })),
                ]}
                value={building}
                onChange={(e) => handleBuildingChange(e.target.value)}
              />
            </div>

            <Input
              label="Specific Spot / Location Label"
              placeholder="e.g. 2nd Floor Corridor, Main Entrance"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
            />
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-slate-600 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-brand-600" />
              <span>
                Coordinates: {latitude.toFixed(5)}, {longitude.toFixed(5)}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              Auto-calibrated
            </span>
          </div>
        </Card>
      )}

      {/* Step 5: Final Review & Submit */}
      {step === 4 && (
        <Card className="space-y-5">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Review & Submit Incident
            </h3>
            <p className="text-xs text-slate-500">
              Confirm the report before broadcasting to safety intelligence
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="font-bold text-slate-900">{title}</span>
              <span className="font-bold uppercase text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                {incidentType}
              </span>
            </div>

            <p className="text-slate-600 whitespace-pre-wrap">{description}</p>

            <div className="pt-2 border-t border-slate-200 grid grid-cols-2 gap-2 text-slate-500">
              <div>
                <span className="font-semibold text-slate-700">Severity: </span>
                <span className="uppercase font-bold text-rose-700">{severity}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-700">Location: </span>
                <span>{locationName || building || 'General Campus'}</span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Step Navigation Buttons */}
      <div className="flex items-center justify-between pt-2">
        <Button
          variant="secondary"
          size="md"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          leftIcon={<ChevronLeft className="w-4 h-4" />}
        >
          Previous
        </Button>

        {step < steps.length - 1 ? (
          <Button
            variant="primary"
            size="md"
            onClick={() => setStep((s) => Math.min(steps.length - 1, s + 1))}
            disabled={!canNext()}
            rightIcon={<ChevronRight className="w-4 h-4" />}
          >
            Continue
          </Button>
        ) : (
          <Button
            variant="danger"
            size="md"
            onClick={handleSubmit}
            isLoading={createIncident.isPending}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Submit Incident Report
          </Button>
        )}
      </div>
    </div>
  );
}
