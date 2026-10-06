from typing import Any, Dict, List, Optional

from pydantic import BaseModel


class DashboardStats(BaseModel):
    total_incidents: int
    active_incidents: int
    resolved_incidents: int
    total_users: int
    incidents_by_type: Dict[str, int]
    incidents_by_severity: Dict[str, int]
    incidents_by_status: Dict[str, int]
    recent_incidents: List[Dict[str, Any]]
    monthly_trend: List[Dict[str, Any]]


class AnalyticsResponse(BaseModel):
    incidents_per_day: List[Dict[str, Any]]
    avg_resolution_time_hours: float
    most_affected_areas: List[Dict[str, Any]]
    severity_distribution: Dict[str, int]
    type_distribution: Dict[str, int]
    response_rate: float
