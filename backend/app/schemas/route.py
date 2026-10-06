from typing import Any, Dict, List, Optional

from pydantic import BaseModel, model_validator


class RouteRequestCreate(BaseModel):
    origin_lat: float
    origin_lon: float = 0.0
    dest_lat: float
    dest_lon: float = 0.0
    route_type: str = "recommended"

    @model_validator(mode="before")
    @classmethod
    def handle_aliases(cls, values: Any) -> Any:
        if isinstance(values, dict):
            if "origin_lng" in values and "origin_lon" not in values:
                values["origin_lon"] = values["origin_lng"]
            if "dest_lng" in values and "dest_lon" not in values:
                values["dest_lon"] = values["dest_lng"]
        return values


class RouteResponse(BaseModel):
    total_distance: float
    total_time: float
    estimated_time: Optional[float] = None
    risk_score: float
    risk_level: str
    path_nodes: List[int]
    path_coordinates: List[List[float]]
    explanation: Optional[Dict[str, Any]] = None
    alternative_available: bool = False

    @model_validator(mode="before")
    @classmethod
    def populate_estimated_time(cls, values: Any) -> Any:
        if isinstance(values, dict):
            if "estimated_time" not in values and "total_time" in values:
                values["estimated_time"] = values["total_time"]
            elif "total_time" not in values and "estimated_time" in values:
                values["total_time"] = values["estimated_time"]
        return values


class RouteComparison(BaseModel):
    shortest: RouteResponse
    safest: RouteResponse
    recommended: RouteResponse
    summary: str

