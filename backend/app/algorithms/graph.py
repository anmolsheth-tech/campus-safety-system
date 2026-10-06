import math
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple

from sqlalchemy.orm import Session


@dataclass
class NodeData:
    id: int
    name: str
    latitude: float
    longitude: float
    type: str
    building_id: Optional[int] = None


@dataclass
class EdgeData:
    id: int
    source_id: int
    dest_id: int
    distance: float
    travel_time: float
    base_risk_score: float
    is_blocked: bool
    is_accessible: bool
    edge_type: str


class CampusGraph:
    """Adjacency-list representation of the campus graph with dynamic risk weights."""

    def __init__(self) -> None:
        self.nodes: Dict[int, NodeData] = {}
        self.edges: Dict[int, EdgeData] = {}
        self.adjacency: Dict[int, List[Tuple[int, EdgeData]]] = {}
        self._dynamic_weights: Dict[int, float] = {}

    def load_from_db(self, session: Session) -> None:
        """Load all nodes and edges from the database into plain data objects."""
        from app.models.campus import CampusNode, CampusEdge

        nodes = session.query(CampusNode).all()
        edges = session.query(CampusEdge).all()

        for node in nodes:
            nd = NodeData(
                id=node.id,
                name=node.name,
                latitude=node.latitude,
                longitude=node.longitude,
                type=node.type.value if hasattr(node.type, 'value') else str(node.type),
                building_id=node.building_id,
            )
            self.nodes[node.id] = nd
            if node.id not in self.adjacency:
                self.adjacency[node.id] = []

        for edge in edges:
            ed = EdgeData(
                id=edge.id,
                source_id=edge.source_id,
                dest_id=edge.dest_id,
                distance=edge.distance,
                travel_time=edge.travel_time,
                base_risk_score=edge.base_risk_score,
                is_blocked=edge.is_blocked,
                is_accessible=edge.is_accessible,
                edge_type=edge.edge_type.value if hasattr(edge.edge_type, 'value') else str(edge.edge_type),
            )
            self.edges[edge.id] = ed
            if edge.source_id in self.adjacency:
                self.adjacency[edge.source_id].append((edge.dest_id, ed))
            if edge.dest_id in self.adjacency:
                self.adjacency[edge.dest_id].append((edge.source_id, ed))

    def get_dynamic_cost(
        self, edge: EdgeData, risk_scores: Optional[Dict[int, float]] = None
    ) -> float:
        """Compute dynamic cost for an edge considering risk scores."""
        if edge.is_blocked:
            return float("inf")

        base_cost = edge.travel_time

        if risk_scores and edge.id in risk_scores:
            risk_factor = 1.0 + risk_scores[edge.id] * 3.0
            return base_cost * risk_factor

        return base_cost

    def get_distance_cost(self, edge: EdgeData) -> float:
        """Return pure distance cost (shortest path)."""
        if edge.is_blocked:
            return float("inf")
        return edge.distance

    def get_neighbors(self, node_id: int) -> List[Tuple[int, EdgeData]]:
        """Get neighboring nodes with connecting edges."""
        return self.adjacency.get(node_id, [])

    def find_nearest_node(self, lat: float, lon: float) -> Optional[int]:
        """Find the nearest graph node to given coordinates."""
        best_id = None
        best_dist = float("inf")
        for nid, node in self.nodes.items():
            d = haversine(lat, lon, node.latitude, node.longitude)
            if d < best_dist:
                best_dist = d
                best_id = nid
        return best_id

    def set_dynamic_weights(self, risk_scores: Dict[int, float]) -> None:
        self._dynamic_weights = risk_scores

    def get_dynamic_weights(self) -> Dict[int, float]:
        return self._dynamic_weights


def haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance in meters between two lat/lon points using Haversine formula."""
    R = 6371000.0
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)

    a = (
        math.sin(dphi / 2) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c
