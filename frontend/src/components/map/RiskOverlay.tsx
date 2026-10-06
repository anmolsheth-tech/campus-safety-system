import { Polyline } from 'react-leaflet';
import { useNodes, useEdges } from '@/hooks/useCampus';

export default function RiskOverlay() {
  const { data: nodes } = useNodes();
  const { data: edges } = useEdges();

  if (!nodes || !edges) return null;

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  return (
    <>
      {edges.map((edge) => {
        const from = nodeMap.get(edge.from_node_id);
        const to = nodeMap.get(edge.to_node_id);
        if (!from || !to) return null;

        let color = '#16A34A';
        if (edge.risk_score > 0.7) color = '#DC2626';
        else if (edge.risk_score > 0.4) color = '#D97706';

        return (
          <Polyline
            key={edge.id}
            positions={[
              [from.latitude, from.longitude],
              [to.latitude, to.longitude],
            ]}
            color={color}
            weight={5}
            opacity={0.3}
          />
        );
      })}
    </>
  );
}
