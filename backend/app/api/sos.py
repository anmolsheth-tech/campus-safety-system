from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.database.session import get_db
from app.models.incident import Incident, IncidentSeverity, IncidentStatus, IncidentType
from app.models.user import User
from app.schemas.incident import IncidentResponse
from app.services import incident_service, notification_service

router = APIRouter(prefix="/sos", tags=["sos"])


class SOSTrigger(BaseModel):
    latitude: float
    longitude: float
    location_name: str = "Current Location"
    description: str = "SOS Emergency triggered"


@router.post("/trigger", response_model=IncidentResponse, status_code=status.HTTP_201_CREATED)
def trigger_sos(
    sos_in: SOSTrigger,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    incident = incident_service.create_incident(
        db,
        type=IncidentType.other,
        severity=IncidentSeverity.critical,
        description=f"SOS from {current_user.full_name}: {sos_in.description}",
        latitude=sos_in.latitude,
        longitude=sos_in.longitude,
        location_name=sos_in.location_name,
        reporter_id=current_user.id,
    )

    incident.status = IncidentStatus.active
    incident.is_verified = True
    incident.verified_by = current_user.id
    db.commit()
    db.refresh(incident)

    notification_service.create_sos_notifications(db, incident, current_user)

    return IncidentResponse.model_validate(incident)
