import math
from datetime import datetime, timedelta, timezone

from app.algorithms.graph import CampusGraph, haversine
from app.algorithms.risk_scorer import compute_risk_scores, SEVERITY_WEIGHTS
from app.algorithms.dijkstra import dijkstra
from app.algorithms.astar import astar
from app.database.session import SessionLocal
from tests.conftest import TestSession
from app.models.incident import (
    Incident,
    IncidentSeverity,
    IncidentStatus,
    IncidentType,
)


class TestHaversine:
    def test_same_point(self):
        assert haversine(28.6139, 77.2090, 28.6139, 77.2090) == 0.0

    def test_known_distance(self):
        dist = haversine(28.6139, 77.2090, 28.6149, 77.2090)
        assert 90 < dist < 130

    def test_symmetric(self):
        d1 = haversine(28.61, 77.20, 28.62, 77.21)
        d2 = haversine(28.62, 77.21, 28.61, 77.20)
        assert abs(d1 - d2) < 0.01


class TestCampusGraph:
    def test_load_from_db(self):
        session = TestSession()
        try:
            graph = CampusGraph()
            graph.load_from_db(session)
            assert len(graph.nodes) > 0
            assert len(graph.edges) > 0
            assert len(graph.adjacency) > 0
        finally:
            session.close()

    def test_find_nearest_node(self):
        session = TestSession()
        try:
            graph = CampusGraph()
            graph.load_from_db(session)
            node_id = graph.find_nearest_node(28.6139, 77.2090)
            assert node_id is not None
            assert node_id in graph.nodes
        finally:
            session.close()

    def test_get_neighbors(self):
        session = TestSession()
        try:
            graph = CampusGraph()
            graph.load_from_db(session)
            for nid in list(graph.nodes.keys())[:5]:
                neighbors = graph.get_neighbors(nid)
                assert isinstance(neighbors, list)
        finally:
            session.close()


class TestDijkstra:
    def test_find_path(self):
        session = TestSession()
        try:
            graph = CampusGraph()
            graph.load_from_db(session)
            nodes = list(graph.nodes.keys())
            result = dijkstra(graph, nodes[0], nodes[-1])
            if result:
                path, cost = result
                assert len(path) >= 2
                assert path[0] == nodes[0]
                assert path[-1] == nodes[-1]
                assert cost >= 0
        finally:
            session.close()

    def test_no_path_invalid_nodes(self):
        session = TestSession()
        try:
            graph = CampusGraph()
            graph.load_from_db(session)
            result = dijkstra(graph, -999, -888)
            assert result is None
        finally:
            session.close()


class TestAStar:
    def test_find_path(self):
        session = TestSession()
        try:
            graph = CampusGraph()
            graph.load_from_db(session)
            nodes = list(graph.nodes.keys())
            result = astar(graph, nodes[0], nodes[-1])
            if result:
                path, cost = result
                assert len(path) >= 2
                assert path[0] == nodes[0]
                assert path[-1] == nodes[-1]
        finally:
            session.close()

    def test_no_path_invalid(self):
        session = TestSession()
        try:
            graph = CampusGraph()
            graph.load_from_db(session)
            result = astar(graph, -999, -888)
            assert result is None
        finally:
            session.close()


class TestRiskScorer:
    def test_no_incidents_low_risk(self):
        session = TestSession()
        try:
            graph = CampusGraph()
            graph.load_from_db(session)
            risk_scores = compute_risk_scores(graph, [])
            for eid, score in risk_scores.items():
                assert 0.0 <= score <= 1.0
        finally:
            session.close()

    def test_critical_incident_increases_risk(self):
        session = TestSession()
        try:
            graph = CampusGraph()
            graph.load_from_db(session)
            mid_node = list(graph.nodes.values())[len(graph.nodes) // 2]
            incident = Incident(
                type=IncidentType.fire,
                severity=IncidentSeverity.critical,
                description="Fire test",
                latitude=mid_node.latitude,
                longitude=mid_node.longitude,
                status=IncidentStatus.active,
                is_verified=True,
                created_at=datetime.now(timezone.utc),
            )
            risk_scores = compute_risk_scores(graph, [incident])
            has_elevated = any(s > 0.1 for s in risk_scores.values())
            assert has_elevated
        finally:
            session.close()

    def test_severity_weights_ordering(self):
        assert SEVERITY_WEIGHTS["low"] < SEVERITY_WEIGHTS["moderate"]
        assert SEVERITY_WEIGHTS["moderate"] < SEVERITY_WEIGHTS["high"]
        assert SEVERITY_WEIGHTS["high"] < SEVERITY_WEIGHTS["critical"]

    def test_old_incident_lower_risk(self):
        session = TestSession()
        try:
            graph = CampusGraph()
            graph.load_from_db(session)
            mid_node = list(graph.nodes.values())[len(graph.nodes) // 2]

            recent = Incident(
                type=IncidentType.fire,
                severity=IncidentSeverity.high,
                description="Recent fire",
                latitude=mid_node.latitude,
                longitude=mid_node.longitude,
                status=IncidentStatus.active,
                is_verified=True,
                created_at=datetime.now(timezone.utc),
            )
            old = Incident(
                type=IncidentType.fire,
                severity=IncidentSeverity.high,
                description="Old fire",
                latitude=mid_node.latitude,
                longitude=mid_node.longitude,
                status=IncidentStatus.active,
                is_verified=True,
                created_at=datetime.now(timezone.utc) - timedelta(hours=48),
            )

            risk_recent = compute_risk_scores(graph, [recent])
            risk_old = compute_risk_scores(graph, [old])

            avg_recent = sum(risk_recent.values()) / max(len(risk_recent), 1)
            avg_old = sum(risk_old.values()) / max(len(risk_old), 1)
            assert avg_recent >= avg_old
        finally:
            session.close()

    def test_risk_normalization(self):
        session = TestSession()
        try:
            graph = CampusGraph()
            graph.load_from_db(session)
            mid_node = list(graph.nodes.values())[len(graph.nodes) // 2]

            incidents = []
            for i in range(10):
                incidents.append(Incident(
                    type=IncidentType.fire,
                    severity=IncidentSeverity.critical,
                    description=f"Fire {i}",
                    latitude=mid_node.latitude + (i * 0.0001),
                    longitude=mid_node.longitude,
                    status=IncidentStatus.active,
                    is_verified=True,
                    created_at=datetime.now(timezone.utc),
                ))

            risk_scores = compute_risk_scores(graph, incidents)
            for eid, score in risk_scores.items():
                if score != float("inf"):
                    assert 0.0 <= score <= 1.0, f"Risk score {score} out of range"
        finally:
            session.close()
