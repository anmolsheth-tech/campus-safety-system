import enum

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database.base import Base


class IncidentType(str, enum.Enum):
    medical = "medical"
    fire = "fire"
    accident = "accident"
    harassment = "harassment"
    flood = "flood"
    blockage = "blockage"
    suspicious = "suspicious"
    other = "other"


class IncidentSeverity(str, enum.Enum):
    low = "low"
    moderate = "moderate"
    high = "high"
    critical = "critical"


class IncidentStatus(str, enum.Enum):
    reported = "reported"
    under_review = "under_review"
    verified = "verified"
    active = "active"
    resolved = "resolved"
    rejected = "rejected"


class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(Enum(IncidentType), nullable=False)
    severity = Column(Enum(IncidentSeverity), nullable=False)
    description = Column(Text, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    location_name = Column(String(255), nullable=True)
    status = Column(
        Enum(IncidentStatus), default=IncidentStatus.reported, nullable=False
    )
    reporter_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    verified_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    image_url = Column(String(512), nullable=True)
    is_verified = Column(Boolean, default=False, nullable=False)

    reporter = relationship(
        "User", back_populates="reported_incidents", foreign_keys=[reporter_id]
    )
    verifier = relationship(
        "User", back_populates="verified_incidents", foreign_keys=[verified_by]
    )
    updates = relationship("IncidentUpdate", back_populates="incident")
    notifications = relationship("Notification", back_populates="incident")


class IncidentUpdate(Base):
    __tablename__ = "incident_updates"

    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(Integer, ForeignKey("incidents.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    old_status = Column(String(50), nullable=True)
    new_status = Column(String(50), nullable=True)
    old_severity = Column(String(50), nullable=True)
    new_severity = Column(String(50), nullable=True)
    note = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    incident = relationship("Incident", back_populates="updates")
    user = relationship("User", back_populates="incident_updates")
