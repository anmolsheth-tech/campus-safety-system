import heapq
from typing import Dict, List, Optional, Tuple

from app.algorithms.graph import CampusGraph


def dijkstra(
    graph: CampusGraph,
    start_id: int,
    end_id: int,
    cost_fn=None,
) -> Optional[Tuple[List[int], float]]:
    """
    Standard Dijkstra's algorithm.
    Returns (path, total_cost) or None if no path exists.
    """
    if start_id not in graph.nodes or end_id not in graph.nodes:
        return None

    if cost_fn is None:
        cost_fn = lambda edge: edge.travel_time

    distances: Dict[int, float] = {node_id: float("inf") for node_id in graph.nodes}
    distances[start_id] = 0.0
    predecessors: Dict[int, Optional[int]] = {node_id: None for node_id in graph.nodes}
    visited: set = set()
    heap: List[Tuple[float, int]] = [(0.0, start_id)]

    while heap:
        current_dist, current_id = heapq.heappop(heap)

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
            new_dist = current_dist + cost
            if new_dist < distances[neighbor_id]:
                distances[neighbor_id] = new_dist
                predecessors[neighbor_id] = current_id
                heapq.heappush(heap, (new_dist, neighbor_id))

    if distances[end_id] == float("inf"):
        return None

    path = []
    current: Optional[int] = end_id
    while current is not None:
        path.append(current)
        current = predecessors[current]
    path.reverse()

    return path, distances[end_id]
