from typing import Any, Dict, List

from app.algorithms.graph import CampusGraph


def generate_route_explanation(
    graph: CampusGraph,
    shortest_path: List[int],
    safest_path: List[int],
    recommended_path: List[int],
    risk_scores: Dict[int, float],
) -> Dict[str, Any]:
    """Generate human-readable route explanation comparing shortest vs safest."""
    shortest_risk = _path_risk(graph, shortest_path, risk_scores)
    safest_risk = _path_risk(graph, safest_path, risk_scores)
    recommended_risk = _path_risk(graph, recommended_path, risk_scores)

    shortest_distance = _path_distance(graph, shortest_path)
    safest_distance = _path_distance(graph, safest_path)
    recommended_distance = _path_distance(graph, recommended_path)

    explanation: Dict[str, Any] = {
        "summary": _build_summary(
            shortest_distance, safest_distance, recommended_distance,
            shortest_risk, safest_risk, recommended_risk,
        ),
        "shortest_route": {
            "distance_meters": round(shortest_distance, 1),
            "time_minutes": round(shortest_distance / 80.0, 1),
            "risk_score": round(shortest_risk, 3),
            "risk_level": _risk_level(shortest_risk),
            "node_count": len(shortest_path),
        },
        "safest_route": {
            "distance_meters": round(safest_distance, 1),
            "time_minutes": round(safest_distance / 80.0, 1),
            "risk_score": round(safest_risk, 3),
            "risk_level": _risk_level(safest_risk),
            "node_count": len(safest_path),
        },
        "recommended_route": {
            "distance_meters": round(recommended_distance, 1),
            "time_minutes": round(recommended_distance / 80.0, 1),
            "risk_score": round(recommended_risk, 3),
            "risk_level": _risk_level(recommended_risk),
            "node_count": len(recommended_path),
        },
        "warnings": _get_warnings(graph, recommended_path, risk_scores),
        "directions": _generate_directions(graph, recommended_path),
        "recommendation_reason": _recommendation_reason(
            shortest_distance, safest_distance, recommended_distance,
            shortest_risk, safest_risk,
        ),
    }

    return explanation


def _generate_directions(graph: CampusGraph, path: List[int]) -> List[Dict[str, Any]]:
    """Generate human-readable turn-by-turn walking steps."""
    directions = []
    for i in range(len(path) - 1):
        src_node = graph.nodes.get(path[i])
        dst_node = graph.nodes.get(path[i + 1])
        if not src_node or not dst_node:
            continue

        edge_dist = 0.0
        edge_type = "walkway"
        for neighbor_id, edge in graph.get_neighbors(path[i]):
            if neighbor_id == path[i + 1]:
                edge_dist = edge.distance
                edge_type = edge.edge_type
                break

        directions.append({
            "step": i + 1,
            "from": src_node.name,
            "to": dst_node.name,
            "distance_meters": round(edge_dist, 1),
            "pathway": edge_type.capitalize(),
            "instruction": f"Walk {round(edge_dist):d}m along {edge_type} from {src_node.name} to {dst_node.name}",
        })
    return directions


def _path_distance(graph: CampusGraph, path: List[int]) -> float:
    """Calculate total distance of a path."""
    total = 0.0
    for i in range(len(path) - 1):
        for neighbor_id, edge in graph.get_neighbors(path[i]):
            if neighbor_id == path[i + 1]:
                total += edge.distance
                break
    return total


def _path_risk(
    graph: CampusGraph, path: List[int], risk_scores: Dict[int, float]
) -> float:
    """Calculate average risk score along a path."""
    if len(path) < 2:
        return 0.0

    total_risk = 0.0
    edge_count = 0

    for i in range(len(path) - 1):
        for neighbor_id, edge in graph.get_neighbors(path[i]):
            if neighbor_id == path[i + 1]:
                risk = risk_scores.get(edge.id, edge.base_risk_score)
                if risk != float("inf"):
                    total_risk += risk
                else:
                    total_risk += 1.0
                edge_count += 1
                break

    return total_risk / max(edge_count, 1)


def _risk_level(score: float) -> str:
    if score < 0.2:
        return "low"
    elif score < 0.5:
        return "moderate"
    elif score < 0.75:
        return "high"
    else:
        return "critical"


def _build_summary(
    shortest_dist: float,
    safest_dist: float,
    recommended_dist: float,
    shortest_risk: float,
    safest_risk: float,
    recommended_risk: float,
) -> str:
    dist_diff = ((safest_dist - shortest_dist) / max(shortest_dist, 1)) * 100
    risk_diff = ((shortest_risk - safest_risk) / max(shortest_risk, 0.01)) * 100

    parts = []
    parts.append(
        f"The safest route is {dist_diff:.0f}% longer than the shortest route."
    )
    parts.append(
        f"It reduces your risk exposure by approximately {risk_diff:.0f}%."
    )
    if recommended_risk < shortest_risk:
        parts.append(
            f"The recommended route balances safety and efficiency with a risk score of {recommended_risk:.2f}."
        )

    return " ".join(parts)


def _get_warnings(
    graph: CampusGraph, path: List[int], risk_scores: Dict[int, float]
) -> List[str]:
    warnings: List[str] = []
    for i in range(len(path) - 1):
        for neighbor_id, edge in graph.get_neighbors(path[i]):
            if neighbor_id == path[i + 1]:
                risk = risk_scores.get(edge.id, edge.base_risk_score)
                if risk > 0.5:
                    warnings.append(
                        f"High risk area near node {path[i+1]} (risk: {risk:.2f})"
                    )
                if edge.is_blocked:
                    warnings.append(f"Edge {edge.id} is blocked")
                break
    return warnings


def _recommendation_reason(
    shortest_dist: float,
    safest_dist: float,
    recommended_dist: float,
    shortest_risk: float,
    safest_risk: float,
) -> str:
    risk_diff = shortest_risk - safest_risk
    dist_diff = safest_dist - shortest_dist

    if risk_diff > 0.3:
        return (
            "A significantly safer route is available with moderate extra distance. "
            "This route avoids high-risk areas while keeping travel time reasonable."
        )
    elif risk_diff > 0.1:
        return (
            "This route offers a good balance between distance and safety. "
            "It routes around known incident areas with minimal detour."
        )
    elif dist_diff < 50:
        return (
            "The shortest and safest routes are nearly identical. "
            "No significant safety concerns detected on the direct path."
        )
    else:
        return (
            "Current conditions suggest the direct route is both shortest and relatively safe. "
            "No major incident zones affect this path."
        )
