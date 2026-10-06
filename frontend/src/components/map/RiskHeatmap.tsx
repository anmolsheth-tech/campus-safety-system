import { Circle, Polyline, Tooltip } from 'react-leaflet';
import type { Incident } from '@/types';
import { useEdges, useNodes } from '@/hooks/useCampus';

interface RiskHeatmapProps {
  incidents: Incident[];
  showZones?: boolean;
  showPathwayRisk?: boolean;
}

const SEVERITY_RADII: Record<string, { outer: number; mid: number; inner: number }> = {
  critical: { outer: 120, mid: 65, inner: 30 },
  high: { outer: 90, mid: 50, inner: 22 },
  medium: { outer: 65, mid: 35, inner: 16 },
  low: { outer: 45, mid: 25, inner: 12 },
};

const SEVERITY_COLORS: Record<string, { outer: string; mid: string; inner: string; border: string }> = {
  critical: {
    outer: 'rgba(239, 68, 68, 0.12)',
    mid: 'rgba(239, 68, 68, 0.28)',
    inner: 'rgba(220, 38, 38, 0.45)',
    border: '#DC2626',
  },
  high: {
    outer: 'rgba(249, 115, 22, 0.12)',
    mid: 'rgba(249, 115, 22, 0.28)',
    inner: 'rgba(234, 88, 12, 0.45)',
    border: '#EA580C',
  },
  medium: {
    outer: 'rgba(245, 158, 11, 0.10)',
    mid: 'rgba(245, 158, 11, 0.22)',
    inner: 'rgba(217, 119, 6, 0.40)',
    border: '#D97706',
  },
  low: {
    outer: 'rgba(16, 185, 129, 0.08)',
    mid: 'rgba(16, 185, 129, 0.18)',
    inner: 'rgba(5, 150, 105, 0.35)',
    border: '#059669',
  },
};

export default function RiskHeatmap({ incidents, showZones = true, showPathwayRisk = true }: RiskHeatmapProps) {
  const { data: nodes } = useNodes();
  const { data: edges } = useEdges();

  const activeIncidents = incidents.filter(
    (inc) => inc.status !== 'resolved' && inc.status !== 'rejected'
  );

  const nodeMap = new Map((nodes || []).map((n) => [n.id, n]));

  return (
    <>
      {/* 1. Pathway Risk Overlay */}
      {showPathwayRisk &&
        edges?.map((edge) => {
          const from = nodeMap.get(edge.from_node_id);
          const to = nodeMap.get(edge.to_node_id);
          if (!from || !to) return null;

          let color = '#10B981'; // green / safe
          let weight = 3;
          let opacity = 0.35;
          let dashArray: string | undefined = undefined;

          if (edge.risk_score >= 0.7) {
            color = '#EF4444'; // critical / high danger
            weight = 6;
            opacity = 0.8;
            dashArray = '4 4';
          } else if (edge.risk_score >= 0.4) {
            color = '#F59E0B'; // moderate risk
            weight = 4.5;
            opacity = 0.6;
          }

          return (
            <Polyline
              key={`edge-${edge.id}`}
              positions={[
                [from.latitude, from.longitude],
                [to.latitude, to.longitude],
              ]}
              color={color}
              weight={weight}
              opacity={opacity}
              dashArray={dashArray}
            >
              {edge.risk_score >= 0.4 && (
                <Tooltip sticky>
                  <div className="text-xs p-0.5">
                    <span className="font-semibold text-red-600">
                      Hazard Factor: {(edge.risk_score * 100).toFixed(0)}%
                    </span>
                    <p className="text-[10px] text-slate-500">
                      {edge.lighting_level === 'dark' ? 'Poor Lighting' : 'Active Hazard Vicinity'}
                    </p>
                  </div>
                </Tooltip>
              )}
            </Polyline>
          );
        })}

      {/* 2. Radial Hazard Heatmap Disks around Active Incidents */}
      {showZones &&
        activeIncidents.map((incident) => {
          const config = SEVERITY_RADII[incident.severity] || SEVERITY_RADII.medium;
          const colors = SEVERITY_COLORS[incident.severity] || SEVERITY_COLORS.medium;
          const center: [number, number] = [incident.latitude, incident.longitude];

          return (
            <div key={`heat-zone-${incident.id}`}>
              {/* Outer Hazard Halo */}
              <Circle
                center={center}
                radius={config.outer}
                pathOptions={{
                  fillColor: colors.border,
                  fillOpacity: 0.12,
                  color: colors.border,
                  weight: 1,
                  opacity: 0.25,
                  dashArray: '3 6',
                }}
              />

              {/* Mid Danger Zone */}
              <Circle
                center={center}
                radius={config.mid}
                pathOptions={{
                  fillColor: colors.border,
                  fillOpacity: 0.25,
                  color: colors.border,
                  weight: 1.5,
                  opacity: 0.45,
                }}
              />

              {/* Inner Epicenter Core */}
              <Circle
                center={center}
                radius={config.inner}
                pathOptions={{
                  fillColor: colors.border,
                  fillOpacity: 0.45,
                  color: colors.border,
                  weight: 2,
                  opacity: 0.8,
                }}
              >
                <Tooltip direction="top" offset={[0, -10]}>
                  <div className="text-xs font-medium">
                    <span className="capitalize font-bold text-red-600">{incident.severity} Risk Zone</span>
                    <p className="text-[10px] text-slate-600">{incident.title}</p>
                  </div>
                </Tooltip>
              </Circle>
            </div>
          );
        })}
    </>
  );
}
