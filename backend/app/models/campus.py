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


class NodeType(str, enum.Enum):
    intersection = "intersection"
    building_entrance = "building_entrance"
    gate = "gate"
    facility = "facility"
    path_point = "path_point"


class EdgeType(str, enum.Enum):
    walkway = "walkway"
    road = "road"
    corridor = "corridor"
    stairway = "stairway"


class BuildingType(str, enum.Enum):
    academic = "academic"
    admin = "admin"
    residential = "residential"
    sports = "sports"
    medical = "medical"
    commercial = "commercial"


class EmergencyLocationType(str, enum.Enum):
    security_office = "security_office"
    medical_centre = "medical_centre"
    police_post = "police_post"
    fire_safety = "fire_safety"
    assembly_point = "assembly_point"
    main_gate = "main_gate"


class Building(Base):
    __tablename__ = "buildings"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    code = Column(String(50), unique=True, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    description = Column(Text, nullable=True)
    building_type = Column(Enum(BuildingType), nullable=False)

    nodes = relationship("CampusNode", back_populates="building")


class CampusNode(Base):
    __tablename__ = "campus_nodes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    type = Column(Enum(NodeType), nullable=False)
    building_id = Column(Integer, ForeignKey("buildings.id"), nullable=True)

    building = relationship("Building", back_populates="nodes")
    outgoing_edges = relationship(
        "CampusEdge",
        back_populates="source",
        foreign_keys="CampusEdge.source_id",
    )
    incoming_edges = relationship(
        "CampusEdge",
        back_populates="destination",
        foreign_keys="CampusEdge.dest_id",
    )


class CampusEdge(Base):
    __tablename__ = "campus_edges"

    id = Column(Integer, primary_key=True, index=True)
    source_id = Column(Integer, ForeignKey("campus_nodes.id"), nullable=False)
    dest_id = Column(Integer, ForeignKey("campus_nodes.id"), nullable=False)
    distance = Column(Float, nullable=False)
    travel_time = Column(Float, nullable=False)
    base_risk_score = Column(Float, default=0.0, nullable=False)
    is_blocked = Column(Boolean, default=False, nullable=False)
    is_accessible = Column(Boolean, default=True, nullable=False)
    edge_type = Column(Enum(EdgeType), default=EdgeType.walkway, nullable=False)

    source = relationship(
        "CampusNode", back_populates="outgoing_edges", foreign_keys=[source_id]
    )
    destination = relationship(
        "CampusNode", back_populates="incoming_edges", foreign_keys=[dest_id]
    )


class EmergencyLocation(Base):
    __tablename__ = "emergency_locations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    type = Column(Enum(EmergencyLocationType), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    phone = Column(String(20), nullable=True)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
