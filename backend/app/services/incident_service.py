from datetime import datetime, timezone
from typing import List, Optional

from sqlalchemy.orm import Session

from app.ml.severity_predictor import predictor
from app.models.incident import Incident, IncidentSeverity, IncidentStatus, IncidentType, IncidentUpdate
from app.models.user import User


def create_incident(
    db: Session,
    *,
    type: IncidentType,
    severity: IncidentSeverity,
    description: str,
    latitude: float,
    longitude: float,
    location_name: Optional[str] = None,
    image_url: Optional[str] = None,
    reporter_id: int,
) -> Incident:
    incident = Incident(
        type=type,
        severity=severity,
        description=description,
        latitude=latitude,
        longitude=longitude,
        location_name=location_name,
        image_url=image_url,
        reporter_id=reporter_id,
        status=IncidentStatus.reported,
        is_verified=False,
    )
    db.add(incident)
    db.commit()
    db.refresh(incident)
    return incident


def update_incident_status(
    db: Session,
    incident: Incident,
    new_status: IncidentStatus,
    user_id: int,
    note: Optional[str] = None,
) -> Incident:
    old_status = incident.status.value
    incident.status = new_status
    incident.updated_at = datetime.now(timezone.utc)

    if new_status == IncidentStatus.resolved:
        incident.resolved_at = datetime.now(timezone.utc)

    update = IncidentUpdate(
        incident_id=incident.id,
        user_id=user_id,
        old_status=old_status,
        new_status=new_status.value,
        note=note,
    )
    db.add(update)
    db.commit()
    db.refresh(incident)
    return incident


def update_incident_severity(
    db: Session,
    incident: Incident,
    new_severity: IncidentSeverity,
    user_id: int,
    note: Optional[str] = None,
) -> Incident:
    old_severity = incident.severity.value
    incident.severity = new_severity
    incident.updated_at = datetime.now(timezone.utc)

    update = IncidentUpdate(
        incident_id=incident.id,
        user_id=user_id,
        old_severity=old_severity,
        new_severity=new_severity.value,
        note=note,
    )
    db.add(update)
    db.commit()
    db.refresh(incident)
    return incident


def verify_incident(
    db: Session,
    incident: Incident,
    user_id: int,
    is_verified: bool = True,
    note: Optional[str] = None,
) -> Incident:
    incident.is_verified = is_verified
    incident.verified_by = user_id
    incident.updated_at = datetime.now(timezone.utc)

    if is_verified:
        incident.status = IncidentStatus.verified
    else:
        incident.status = IncidentStatus.rejected

    update = IncidentUpdate(
        incident_id=incident.id,
        user_id=user_id,
        old_status=incident.status.value,
        new_status=incident.status.value,
        note=note or ("Verified" if is_verified else "Rejected"),
    )
    db.add(update)
    db.commit()
    db.refresh(incident)
    return incident


def get_active_incidents(db: Session) -> List[Incident]:
    return (
        db.query(Incident)
        .filter(
            Incident.status.in_([
                IncidentStatus.reported,
                IncidentStatus.verified,
                IncidentStatus.active,
            ])
        )
        .all()
    )


def predict_severity(incident_type: str, description: str, latitude: float = 0, longitude: float = 0):
    now = datetime.now()
    has_location_name = len(description) > 20
    return predictor.predict(
        incident_type=incident_type,
        hour_of_day=now.hour,
        day_of_week=now.weekday(),
        description_length=len(description),
        has_location_name=has_location_name,
    )
