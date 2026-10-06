import enum

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    JSON,
    String,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database.base import Base


class RouteType(str, enum.Enum):
    shortest = "shortest"
    safest = "safest"
    recommended = "recommended"


class RouteRequest(Base):
    __tablename__ = "route_requests"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    origin_lat = Column(Float, nullable=False)
    origin_lon = Column(Float, nullable=False)
    dest_lat = Column(Float, nullable=False)
    dest_lon = Column(Float, nullable=False)
    route_type = Column(Enum(RouteType), default=RouteType.recommended, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="route_requests")
    result = relationship("RouteResult", back_populates="request", uselist=False)


class RouteResult(Base):
    __tablename__ = "route_results"

    id = Column(Integer, primary_key=True, index=True)
    request_id = Column(Integer, ForeignKey("route_requests.id"), nullable=False)
    total_distance = Column(Float, nullable=False)
    total_time = Column(Float, nullable=False)
    risk_score = Column(Float, nullable=False)
    risk_level = Column(String(20), nullable=False)
    path_nodes = Column(JSON, nullable=False)
    path_coordinates = Column(JSON, nullable=False)
    explanation = Column(JSON, nullable=True)
    alternative_available = Column(Boolean, default=False, nullable=False)

    request = relationship("RouteRequest", back_populates="result")
