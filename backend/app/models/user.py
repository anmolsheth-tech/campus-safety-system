import enum

from sqlalchemy import Boolean, Column, DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database.base import Base


class UserRole(str, enum.Enum):
    student = "student"
    admin = "admin"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.student, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    phone = Column(String(20), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    reported_incidents = relationship(
        "Incident", back_populates="reporter", foreign_keys="Incident.reporter_id"
    )
    verified_incidents = relationship(
        "Incident", back_populates="verifier", foreign_keys="Incident.verified_by"
    )
    incident_updates = relationship("IncidentUpdate", back_populates="user")
    notifications = relationship("Notification", back_populates="user")
    route_requests = relationship("RouteRequest", back_populates="user")
