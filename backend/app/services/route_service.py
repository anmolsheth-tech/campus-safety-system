from typing import Dict, List, Optional, Tuple

from sqlalchemy.orm import Session

from app.algorithms.astar import astar
from app.algorithms.dijkstra import dijkstra
from app.algorithms.graph import CampusGraph, haversine
from app.algorithms.risk_scorer import compute_risk_scores
from app.algorithms.route_explainer import generate_route_explanation
from app.models.campus import CampusEdge, CampusNode
from app.models.incident import Incident


_graph_cache: Optional[CampusGraph] = None


def get_graph(db: Session) -> CampusGraph:
    global _graph_cache
    if _graph_cache is None:
        _graph_cache = CampusGraph()
        _graph_cache.load_from_db(db)
    return _graph_cache


def invalidate_graph_cache() -> None:
    global _graph_cache
    _graph_cache = None


def find_nearest_node(graph: CampusGraph, lat: float, lon: float) -> Optional[int]:
    return graph.find_nearest_node(lat, lon)


def compute_shortest_route(
    db: Session,
    origin_lat: float,
    origin_lon: float,
    dest_lat: float,
    dest_lon: float,
) -> Optional[Dict]:
    graph = get_graph(db)
    active_incidents = db.query(Incident).all()
    risk_scores = compute_risk_scores(graph, active_incidents)

    start_id = find_nearest_node(graph, origin_lat, origin_lon)
    end_id = find_nearest_node(graph, dest_lat, dest_lon)

    if start_id is None or end_id is None:
        return None

    result = dijkstra(graph, start_id, end_id, cost_fn=graph.get_distance_cost)
    if result is None:
        return None

    path, _ = result
    return _build_route_response(graph, path, "shortest", risk_scores)


def compute_safest_route(
    db: Session,
    origin_lat: float,
    origin_lon: float,
    dest_lat: float,
    dest_lon: float,
) -> Optional[Dict]:
    graph = get_graph(db)
    active_incidents = db.query(Incident).all()
    risk_scores = compute_risk_scores(graph, active_incidents)

    start_id = find_nearest_node(graph, origin_lat, origin_lon)
    end_id = find_nearest_node(graph, dest_lat, dest_lon)

    if start_id is None or end_id is None:
        return None

    def safe_cost(edge: CampusEdge) -> float:
        if edge.is_blocked:
            return float("inf")
        risk = risk_scores.get(edge.id, edge.base_risk_score)
        # Heavy penalty on risk to strongly prefer hazard-free edges
        return edge.distance * (1.0 + (risk ** 2) * 40.0 + risk * 10.0)

    result = dijkstra(graph, start_id, end_id, cost_fn=safe_cost)
    if result is None:
        return None

    path, _ = result
    return _build_route_response(graph, path, "safest", risk_scores)


def compute_recommended_route(
    db: Session,
    origin_lat: float,
    origin_lon: float,
    dest_lat: float,
    dest_lon: float,
) -> Optional[Dict]:
    graph = get_graph(db)
    active_incidents = db.query(Incident).all()
    risk_scores = compute_risk_scores(graph, active_incidents)

    start_id = find_nearest_node(graph, origin_lat, origin_lon)
    end_id = find_nearest_node(graph, dest_lat, dest_lon)

    if start_id is None or end_id is None:
        return None

    def recommended_cost(edge: CampusEdge) -> float:
        if edge.is_blocked:
            return float("inf")
        risk = risk_scores.get(edge.id, edge.base_risk_score)
        # Balanced trade-off: efficient travel with moderate risk penalty
        return edge.distance * (1.0 + risk * 4.0)

    result = astar(graph, start_id, end_id, cost_fn=recommended_cost, heuristic_weight=1.0)
    if result is None:
        result = dijkstra(graph, start_id, end_id, cost_fn=recommended_cost)
    if result is None:
        return None

    path, _ = result

    shortest_result = dijkstra(graph, start_id, end_id, cost_fn=graph.get_distance_cost)
    safest_result = dijkstra(
        graph,
        start_id,
        end_id,
        cost_fn=lambda e: float("inf") if e.is_blocked else e.distance * (1.0 + (risk_scores.get(e.id, e.base_risk_score) ** 2) * 40.0 + risk_scores.get(e.id, e.base_risk_score) * 10.0),
    )

    explanation = None
    if shortest_result and safest_result:
        explanation = generate_route_explanation(
            graph,
            shortest_path=shortest_result[0],
            safest_path=safest_result[0],
            recommended_path=path,
            risk_scores=risk_scores,
        )

    return _build_route_response(
        graph, path, "recommended", risk_scores, explanation
    )


def _build_route_response(
    graph: CampusGraph,
    path: List[int],
    route_type: str,
    risk_scores: Dict[int, float],
    explanation: Optional[Dict] = None,
) -> Dict:
    total_distance = 0.0
    total_travel_time = 0.0
    path_risks = []

    for i in range(len(path) - 1):
        for neighbor_id, edge in graph.get_neighbors(path[i]):
            if neighbor_id == path[i + 1]:
                total_distance += edge.distance
                edge_time = edge.travel_time if (edge.travel_time and edge.travel_time > 0) else (edge.distance / 80.0)
                total_travel_time += edge_time
                risk = risk_scores.get(edge.id, edge.base_risk_score)
                if risk != float("inf"):
                    path_risks.append(risk)
                break

    avg_risk = sum(path_risks) / max(len(path_risks), 1)
    risk_level = _risk_level(avg_risk)

    path_coordinates = []
    for node_id in path:
        node = graph.nodes[node_id]
        path_coordinates.append([node.latitude, node.longitude])

    has_alternative = route_type != "recommended"

    return {
        "total_distance": round(total_distance, 1),
        "total_time": round(total_travel_time, 1),
        "estimated_time": round(total_travel_time, 1),
        "risk_score": round(avg_risk, 4),
        "risk_level": risk_level,
        "path_nodes": path,
        "path_coordinates": path_coordinates,
        "explanation": explanation,
        "alternative_available": has_alternative,
    }


def _risk_level(score: float) -> str:
    if score < 0.2:
        return "low"
    elif score < 0.5:
        return "moderate"
    elif score < 0.75:
        return "high"
    else:
        return "critical"

