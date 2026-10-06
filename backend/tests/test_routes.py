from tests.conftest import client, get_auth_header


class TestRoutes:
    def setup_method(self):
        self.header = get_auth_header("student@demo.com", "password123")

    def test_shortest_route(self):
        response = client.get(
            "/api/routes/shortest",
            params={
                "origin_lat": 28.6079,
                "origin_lon": 77.2090,
                "dest_lat": 28.6139,
                "dest_lon": 77.2120,
            },
            headers=self.header,
        )
        assert response.status_code == 200
        data = response.json()
        assert "total_distance" in data
        assert "total_time" in data
        assert "path_nodes" in data
        assert "path_coordinates" in data
        assert len(data["path_nodes"]) >= 2
        assert len(data["path_coordinates"]) >= 2

    def test_safest_route(self):
        response = client.get(
            "/api/routes/safest",
            params={
                "origin_lat": 28.6079,
                "origin_lon": 77.2090,
                "dest_lat": 28.6139,
                "dest_lon": 77.2120,
            },
            headers=self.header,
        )
        assert response.status_code == 200
        data = response.json()
        assert "risk_score" in data
        assert "risk_level" in data
        assert data["risk_level"] in ["low", "moderate", "high", "critical"]

    def test_recommend_route(self):
        response = client.post(
            "/api/routes/recommend",
            json={
                "origin_lat": 28.6079,
                "origin_lon": 77.2090,
                "dest_lat": 28.6139,
                "dest_lon": 77.2120,
            },
            headers=self.header,
        )
        assert response.status_code == 200
        data = response.json()
        assert "total_distance" in data
        assert "risk_score" in data
        assert "explanation" in data

    def test_compare_routes(self):
        response = client.post(
            "/api/routes/compare",
            json={
                "origin_lat": 28.6079,
                "origin_lon": 77.2090,
                "dest_lat": 28.6139,
                "dest_lon": 77.2120,
            },
            headers=self.header,
        )
        assert response.status_code == 200
        data = response.json()
        assert "shortest" in data
        assert "safest" in data
        assert "recommended" in data
        assert "summary" in data

    def test_route_unauthenticated(self):
        response = client.get(
            "/api/routes/shortest",
            params={
                "origin_lat": 28.6079,
                "origin_lon": 77.2090,
                "dest_lat": 28.6139,
                "dest_lon": 77.2120,
            },
        )
        assert response.status_code == 401

    def test_route_same_point(self):
        response = client.post(
            "/api/routes/recommend",
            json={
                "origin_lat": 28.6139,
                "origin_lon": 77.2090,
                "dest_lat": 28.6139,
                "dest_lon": 77.2090,
            },
            headers=self.header,
        )
        assert response.status_code == 200

    def test_route_has_risk_info(self):
        response = client.post(
            "/api/routes/recommend",
            json={
                "origin_lat": 28.6079,
                "origin_lon": 77.2090,
                "dest_lat": 28.6199,
                "dest_lon": 77.2090,
            },
            headers=self.header,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["risk_level"] in ["low", "moderate", "high", "critical"]
        assert isinstance(data["risk_score"], float)

    def test_shortest_vs_safest_different(self):
        resp_s = client.get(
            "/api/routes/shortest",
            params={
                "origin_lat": 28.6079,
                "origin_lon": 77.2090,
                "dest_lat": 28.6199,
                "dest_lon": 77.2090,
            },
            headers=self.header,
        )
        resp_safe = client.get(
            "/api/routes/safest",
            params={
                "origin_lat": 28.6079,
                "origin_lon": 77.2090,
                "dest_lat": 28.6199,
                "dest_lon": 77.2090,
            },
            headers=self.header,
        )
        assert resp_s.status_code == 200
        assert resp_safe.status_code == 200
