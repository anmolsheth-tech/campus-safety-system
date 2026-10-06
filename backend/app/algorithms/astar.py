import heapq
import math
from typing import Callable, Dict, List, Optional, Tuple

from app.algorithms.graph import CampusGraph, haversine


def astar(
    graph: CampusGraph,
    start_id: int,
    end_id: int,
    cost_fn: Optional[Callable] = None,
    heuristic_weight: float = 1.0,
) -> Optional[Tuple[List[int], float]]:
    """
    A* search algorithm with configurable cost function and Haversine heuristic.
    Returns (path, total_cost) or None if no path exists.
    """
    if start_id not in graph.nodes or end_id not in graph.nodes:
        return None

    if cost_fn is None:
        cost_fn = lambda edge: edge.travel_time

    start_node = graph.nodes[start_id]
    end_node = graph.nodes[end_id]

    def heuristic(node_id: int) -> float:
        """Haversine-based heuristic estimate to goal in meters."""
        node = graph.nodes[node_id]
        return haversine(node.latitude, node.longitude, end_node.latitude, end_node.longitude)

    g_score: Dict[int, float] = {node_id: float("inf") for node_id in graph.nodes}
    g_score[start_id] = 0.0
    f_score: Dict[int, float] = {node_id: float("inf") for node_id in graph.nodes}
    f_score[start_id] = heuristic_weight * heuristic(start_id)
    predecessors: Dict[int, Optional[int]] = {node_id: None for node_id in graph.nodes}
    visited: set = set()
    heap: List[Tuple[float, int]] = [(f_score[start_id], start_id)]

    while heap:
        _, current_id = heapq.heappop(heap)

        if current_id in visited:
            continue
        visited.add(current_id)

        if current_id == end_id:
            break

        for neighbor_id, edge in graph.get_neighbors(current_id):
            if neighbor_id in visited:
                continue
            cost = cost_fn(edge)
            if cost == float("inf"):
                continue
            tentative_g = g_score[current_id] + cost

            if tentative_g < g_score[neighbor_id]:
                predecessors[neighbor_id] = current_id
                g_score[neighbor_id] = tentative_g
                f_score[neighbor_id] = tentative_g + heuristic_weight * heuristic(neighbor_id)
                heapq.heappush(heap, (f_score[neighbor_id], neighbor_id))

    if g_score[end_id] == float("inf"):
        return None

    path: List[int] = []
    current: Optional[int] = end_id
    while current is not None:
        path.append(current)
        current = predecessors[current]
    path.reverse()

    return path, g_score[end_id]
