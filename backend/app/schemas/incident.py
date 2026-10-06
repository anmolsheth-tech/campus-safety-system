from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, model_validator

from app.models.incident import IncidentSeverity, IncidentStatus, IncidentType


class IncidentCreate(BaseModel):
    type: IncidentType
    severity: IncidentSeverity
    description: str
    latitude: float
    longitude: float
    location_name: Optional[str] = None
    image_url: Optional[str] = None

    @model_validator(mode="before")
    @classmethod
    def handle_incident_create_aliases(cls, values: Any) -> Any:
        if isinstance(values, dict):
            # Map incident_type to type
            if "type" not in values and "incident_type" in values:
                t_val = str(values["incident_type"]).lower()
                valid_types = {e.value for e in IncidentType}
                if t_val in valid_types:
                    values["type"] = t_val
                else:
                    type_mapping = {
                        "theft": "suspicious",
                        "assault": "harassment",
                        "structural": "blockage",
                        "suspicious_activity": "suspicious",
                        "vandalism": "suspicious",
                    }
                    values["type"] = type_mapping.get(t_val, "other")

            # Map severity 'medium' to 'moderate'
            if "severity" in values:
                s_val = str(values["severity"]).lower()
                if s_val == "medium":
                    values["severity"] = "moderate"

            # Combine title if description is separate
            if "title" in values and values["title"]:
                title_str = str(values["title"]).strip()
                desc_str = str(values.get("description", "")).strip()
                if desc_str and not desc_str.startswith(title_str):
                    values["description"] = f"{title_str}: {desc_str}"
                elif not desc_str:
                    values["description"] = title_str

        return values


class SeverityPredictionRequest(BaseModel):
    incident_type: str = "other"
    description: str = ""
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class SeverityPredictionResponse(BaseModel):
    recommended_severity: str
    confidence: float
    probabilities: Dict[str, float]
    factors: List[str]


class IncidentStatusUpdate(BaseModel):
    status: IncidentStatus
    note: Optional[str] = None


class IncidentSeverityUpdate(BaseModel):
    severity: IncidentSeverity
    note: Optional[str] = None


class IncidentVerify(BaseModel):
    is_verified: bool = True
    note: Optional[str] = None


class IncidentUpdateSchema(BaseModel):
    id: int
    user_id: int
    old_status: Optional[str] = None
    new_status: Optional[str] = None
    old_severity: Optional[str] = None
    new_severity: Optional[str] = None
    note: Optional[str] = None
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class IncidentResponse(BaseModel):
    id: int
    type: IncidentType
    incident_type: Optional[str] = None
    title: Optional[str] = None
    severity: IncidentSeverity
    description: str
    latitude: float
    longitude: float
    location_name: Optional[str] = None
    status: IncidentStatus
    reporter_id: int
    verified_by: Optional[int] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    image_url: Optional[str] = None
    is_verified: bool
    updates: List[IncidentUpdateSchema] = []

    model_config = {"from_attributes": True}

    @model_validator(mode="before")
    @classmethod
    def populate_response_aliases(cls, values: Any) -> Any:
        if isinstance(values, dict):
            t = values.get("type")
            t_val = t.value if hasattr(t, "value") else str(t) if t else "other"
            desc = str(values.get("description", ""))
            first_line = desc.split(":")[0] if desc else "Incident"
            values.setdefault("incident_type", t_val)
            values.setdefault("title", first_line)
            return values

        if hasattr(values, "type"):
            t = getattr(values, "type")
            t_val = t.value if hasattr(t, "value") else str(t)
            desc = getattr(values, "description", "") or ""
            first_line = desc.split(":")[0] if desc else "Incident"
            return {
                "id": getattr(values, "id"),
                "type": t,
                "incident_type": t_val,
                "title": first_line,
                "severity": getattr(values, "severity"),
                "description": desc,
                "latitude": getattr(values, "latitude"),
                "longitude": getattr(values, "longitude"),
                "location_name": getattr(values, "location_name", None),
                "status": getattr(values, "status"),
                "reporter_id": getattr(values, "reporter_id"),
                "verified_by": getattr(values, "verified_by", None),
                "created_at": getattr(values, "created_at", None),
                "updated_at": getattr(values, "updated_at", None),
                "resolved_at": getattr(values, "resolved_at", None),
                "image_url": getattr(values, "image_url", None),
                "is_verified": getattr(values, "is_verified", False),
                "updates": getattr(values, "updates", []),
            }

        return values


class IncidentListResponse(BaseModel):
    incidents: List[IncidentResponse]
    items: Optional[List[IncidentResponse]] = None
    total: int
    page: int
    per_page: int
    total_pages: Optional[int] = None

    @model_validator(mode="before")
    @classmethod
    def populate_items_and_pages(cls, values: Any) -> Any:
        if isinstance(values, dict):
            inc_list = values.get("incidents", [])
            values.setdefault("items", inc_list)
            tot = values.get("total", len(inc_list))
            pp = values.get("per_page", 20) or 20
            import math
            values.setdefault("total_pages", max(1, math.ceil(tot / pp)))
        return values


