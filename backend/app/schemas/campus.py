from typing import List, Optional

from pydantic import BaseModel


class NodeCreate(BaseModel):
    name: str
    latitude: float
    longitude: float
    type: str
    building_id: Optional[int] = None


class NodeResponse(BaseModel):
    id: int
    name: str
    latitude: float
    longitude: float
    type: str
    building_id: Optional[int] = None

    model_config = {"from_attributes": True}


class EdgeCreate(BaseModel):
    source_id: int
    dest_id: int
    distance: float
    travel_time: float
    base_risk_score: float = 0.0
    is_blocked: bool = False
    is_accessible: bool = True
    edge_type: str = "walkway"


class EdgeResponse(BaseModel):
    id: int
    source_id: int
    dest_id: int
    distance: float
    travel_time: float
    base_risk_score: float
    is_blocked: bool
    is_accessible: bool
    edge_type: str

    model_config = {"from_attributes": True}


class BuildingResponse(BaseModel):
    id: int
    name: str
    code: str
    latitude: float
    longitude: float
    description: Optional[str] = None
    building_type: str

    model_config = {"from_attributes": True}


class EmergencyLocationResponse(BaseModel):
    id: int
    name: str
    type: str
    latitude: float
    longitude: float
    phone: Optional[str] = None
    description: Optional[str] = None
    is_active: bool

    model_config = {"from_attributes": True}
