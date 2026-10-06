import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database.base import Base
from app.database.session import get_db
from app.main import app
from app.seed import seed
from app.services import route_service

TEST_DB_URL = "sqlite:///./test_backend.db"
test_engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestSession = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


def _override_get_db():
    db = TestSession()
    try:
        yield db
    finally:
        db.close()


# Seed into the test database
test_session = TestSession()
seed(target_engine=test_engine, target_session=test_session, verbose=False)
test_session.close()

# Invalidate graph cache so routes load from test DB
route_service.invalidate_graph_cache()

# Override the dependency so all API calls use the test DB
app.dependency_overrides[get_db] = _override_get_db

client = TestClient(app)


def get_auth_header(email="student@demo.com", password="password123"):
    resp = client.post("/api/auth/login", json={"email": email, "password": password})
    token = resp.json().get("access_token")
    return {"Authorization": f"Bearer {token}"}


def teardown_module():
    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=test_engine)
    for f in ["./test_backend.db"]:
        if os.path.exists(f):
            os.remove(f)
