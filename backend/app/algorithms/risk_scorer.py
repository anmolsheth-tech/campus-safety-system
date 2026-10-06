import math
from datetime import datetime, timezone
from typing import Dict, List

from app.algorithms.graph import CampusGraph, haversine
from app.core.config import settings
from app.models.campus import CampusEdge
from app.models.incident import Incident, IncidentSeverity, IncidentStatus


SEVERITY_WEIGHTS = {
    "low": 0.25,
    "moderate": 0.5,
    "high": 0.75,
    "critical": 1.0,
}


def compute_risk_scores(
    graph: CampusGraph,
    active_incidents: List[Incident],
    radius_meters: float = None,
    decay_hours: float = None,
) -> Dict[int, float]:
    """
    Compute dynamic risk scores for all edges based on active incidents.

    For each edge:
    1. Find all active incidents within configurable radius
    2. For each nearby incident:
       - distance_factor = 1 / (1 + distance_to_edge / 100)
       - recency_factor = exp(-hours_since_reported / 6)
       - severity_weight = {low: 0.25, moderate: 0.5, high: 0.75, critical: 1.0}
       - incident_risk = severity_weight * recency_factor * distance_factor
    3. combined_risk = base_risk + sum(incident_risks)
    4. Normalize to 0-1
    5. Apply blocked penalty (infinity cost)
    """
    if radius_meters is None:
        radius_meters = settings.RISK_INCIDENT_RADIUS_METERS
    if decay_hours is None:
        decay_hours = settings.RISK_DECAY_HOURS

    now = datetime.now(timezone.utc)
    risk_scores: Dict[int, float] = {}

    active = [
        inc
        for inc in active_incidents
        if inc.status in (IncidentStatus.verified, IncidentStatus.active, IncidentStatus.reported)
        and inc.status not in (IncidentStatus.resolved, IncidentStatus.rejected)
    ]

    for edge_id, edge in graph.edges.items():
        if edge.is_blocked:
            risk_scores[edge_id] = float("inf")
            continue

        source_node = graph.nodes.get(edge.source_id)
        dest_node = graph.nodes.get(edge.dest_id)
        if not source_node or not dest_node:
            risk_scores[edge_id] = edge.base_risk_score
            continue

        # Sample 3 points along the edge (start, mid, end) for accurate spatial proximity
        sample_points = [
            (source_node.latitude, source_node.longitude),
            ((source_node.latitude + dest_node.latitude) / 2.0, (source_node.longitude + dest_node.longitude) / 2.0),
            (dest_node.latitude, dest_node.longitude),
        ]

        incident_risk_sum = 0.0

        for incident in active:
            min_dist = min(
                haversine(plat, plon, incident.latitude, incident.longitude)
                for plat, plon in sample_points
            )

            if min_dist > radius_meters:
                continue

            distance_factor = 1.0 / (1.0 + (min_dist / 60.0) ** 1.5)

            if incident.created_at:
                if incident.created_at.tzinfo is None:
                    hours_ago = (now.replace(tzinfo=None) - incident.created_at).total_seconds() / 3600.0
                else:
                    hours_ago = (now - incident.created_at).total_seconds() / 3600.0
            else:
                hours_ago = 0.0

            recency_factor = math.exp(-max(0.0, hours_ago) / decay_hours)
            severity_weight = SEVERITY_WEIGHTS.get(incident.severity.value, 0.5)
            verification_weight = 1.0 if incident.is_verified else 0.75

            incident_risk = severity_weight * verification_weight * recency_factor * distance_factor
            incident_risk_sum += incident_risk

        combined = edge.base_risk_score + incident_risk_sum
        risk_scores[edge_id] = min(combined, 1.0)

    return risk_scores
