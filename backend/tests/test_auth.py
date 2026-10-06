from tests.conftest import client, get_auth_header


class TestAuth:
    def test_register_user(self):
        response = client.post("/api/auth/register", json={
            "email": "newuser@test.com",
            "full_name": "New User",
            "password": "testpass123",
        })
        assert response.status_code == 201
        data = response.json()
        assert data["email"] == "newuser@test.com"
        assert data["full_name"] == "New User"
        assert data["role"] == "student"

    def test_register_duplicate_email(self):
        client.post("/api/auth/register", json={
            "email": "dup2@test.com",
            "full_name": "Dup User",
            "password": "pass123",
        })
        response = client.post("/api/auth/register", json={
            "email": "dup2@test.com",
            "full_name": "Dup User 2",
            "password": "pass123",
        })
        assert response.status_code == 400

    def test_login_success(self):
        response = client.post("/api/auth/login", json={
            "email": "student@demo.com",
            "password": "password123",
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    def test_login_wrong_password(self):
        response = client.post("/api/auth/login", json={
            "email": "student@demo.com",
            "password": "wrongpassword",
        })
        assert response.status_code == 401

    def test_login_nonexistent_user(self):
        response = client.post("/api/auth/login", json={
            "email": "nonexistent@test.com",
            "password": "pass",
        })
        assert response.status_code == 401

    def test_get_me_authenticated(self):
        header = get_auth_header()
        response = client.get("/api/auth/me", headers=header)
        assert response.status_code == 200
        assert response.json()["email"] == "student@demo.com"

    def test_get_me_unauthenticated(self):
        response = client.get("/api/auth/me")
        assert response.status_code == 401

    def test_jwt_invalid_token(self):
        response = client.get(
            "/api/auth/me",
            headers={"Authorization": "Bearer invalidtoken123"},
        )
        assert response.status_code == 401
