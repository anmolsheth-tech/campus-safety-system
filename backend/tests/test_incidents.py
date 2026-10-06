from tests.conftest import client, get_auth_header


class TestIncidents:
    def setup_method(self):
        self.student_header = get_auth_header("student@demo.com", "password123")
        self.admin_header = get_auth_header("admin@demo.com", "password123")

    def test_create_incident(self):
        response = client.post(
            "/api/incidents",
            json={
                "type": "fire",
                "severity": "high",
                "description": "Fire in lab building A",
                "latitude": 28.615,
                "longitude": 77.210,
                "location_name": "Lab Building A",
            },
            headers=self.student_header,
        )
        assert response.status_code == 201
        data = response.json()
        assert data["type"] == "fire"
        assert data["severity"] == "high"
        assert data["status"] == "reported"
        assert data["is_verified"] is False

    def test_create_incident_unauthenticated(self):
        response = client.post(
            "/api/incidents",
            json={
                "type": "medical",
                "severity": "moderate",
                "description": "Student injured",
                "latitude": 28.614,
                "longitude": 77.209,
            },
        )
        assert response.status_code == 401

    def test_list_incidents(self):
        response = client.get(
            "/api/incidents",
            headers=self.student_header,
        )
        assert response.status_code == 200
        data = response.json()
        assert "incidents" in data
        assert "total" in data
        assert data["total"] >= 1

    def test_get_incident_by_id(self):
        create_resp = client.post(
            "/api/incidents",
            json={
                "type": "suspicious",
                "severity": "moderate",
                "description": "Suspicious person near gate",
                "latitude": 28.612,
                "longitude": 77.211,
                "location_name": "North Gate",
            },
            headers=self.student_header,
        )
        inc_id = create_resp.json()["id"]
        response = client.get(
            f"/api/incidents/{inc_id}",
            headers=self.student_header,
        )
        assert response.status_code == 200
        assert response.json()["id"] == inc_id

    def test_get_incident_not_found(self):
        response = client.get(
            "/api/incidents/99999",
            headers=self.student_header,
        )
        assert response.status_code == 404

    def test_verify_incident_as_admin(self):
        create_resp = client.post(
            "/api/incidents",
            json={
                "type": "flood",
                "severity": "high",
                "description": "Waterlogging on campus",
                "latitude": 28.616,
                "longitude": 77.212,
                "location_name": "South Campus",
            },
            headers=self.student_header,
        )
        inc_id = create_resp.json()["id"]
        response = client.patch(
            f"/api/incidents/{inc_id}/verify",
            json={"is_verified": True, "note": "Confirmed by security"},
            headers=self.admin_header,
        )
        assert response.status_code == 200
        assert response.json()["is_verified"] is True
        assert response.json()["status"] == "verified"

    def test_verify_incident_as_student_forbidden(self):
        create_resp = client.post(
            "/api/incidents",
            json={
                "type": "other",
                "severity": "low",
                "description": "Something odd",
                "latitude": 28.614,
                "longitude": 77.209,
            },
            headers=self.student_header,
        )
        inc_id = create_resp.json()["id"]
        response = client.patch(
            f"/api/incidents/{inc_id}/verify",
            json={"is_verified": True},
            headers=self.student_header,
        )
        assert response.status_code == 403

    def test_resolve_incident(self):
        create_resp = client.post(
            "/api/incidents",
            json={
                "type": "blockage",
                "severity": "low",
                "description": "Temporary blockage",
                "latitude": 28.615,
                "longitude": 77.210,
            },
            headers=self.student_header,
        )
        inc_id = create_resp.json()["id"]
        response = client.patch(
            f"/api/incidents/{inc_id}/resolve",
            headers=self.admin_header,
        )
        assert response.status_code == 200
        assert response.json()["status"] == "resolved"

    def test_reject_incident(self):
        create_resp = client.post(
            "/api/incidents",
            json={
                "type": "suspicious",
                "severity": "low",
                "description": "False alarm",
                "latitude": 28.614,
                "longitude": 77.209,
            },
            headers=self.student_header,
        )
        inc_id = create_resp.json()["id"]
        response = client.patch(
            f"/api/incidents/{inc_id}/reject",
            headers=self.admin_header,
        )
        assert response.status_code == 200
        assert response.json()["status"] == "rejected"

    def test_update_severity(self):
        create_resp = client.post(
            "/api/incidents",
            json={
                "type": "medical",
                "severity": "low",
                "description": "Minor injury",
                "latitude": 28.613,
                "longitude": 77.208,
            },
            headers=self.student_header,
        )
        inc_id = create_resp.json()["id"]
        response = client.patch(
            f"/api/incidents/{inc_id}/severity",
            json={"severity": "critical", "note": "Worsened condition"},
            headers=self.admin_header,
        )
        assert response.status_code == 200
        assert response.json()["severity"] == "critical"

    def test_list_with_filters(self):
        response = client.get(
            "/api/incidents?incident_type=fire",
            headers=self.student_header,
        )
        assert response.status_code == 200
        data = response.json()
        assert "incidents" in data

    def test_list_pagination(self):
        response = client.get(
            "/api/incidents?page=1&per_page=2",
            headers=self.student_header,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["per_page"] == 2
