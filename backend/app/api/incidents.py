from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_admin, get_current_user
from app.database.session import get_db
from app.ml.severity_predictor import predictor
from app.models.incident import Incident, IncidentStatus
from app.models.user import User
from app.schemas.incident import (
    IncidentCreate,
    IncidentListResponse,
    IncidentResponse,
    IncidentSeverityUpdate,
    IncidentStatusUpdate,
    IncidentVerify,
    SeverityPredictionRequest,
    SeverityPredictionResponse,
)
from app.services import incident_service, notification_service

router = APIRouter(prefix="/incidents", tags=["incidents"])


@router.post("/predict-severity", response_model=SeverityPredictionResponse)
def predict_incident_severity(
    req: SeverityPredictionRequest,
    current_user: User = Depends(get_current_user),
):
    now = datetime.now()
    pred = predictor.predict(
        incident_type=req.incident_type,
        description=req.description,
        hour_of_day=now.hour,
        day_of_week=now.weekday(),
        has_location_name=bool(req.latitude and req.longitude),
    )
    return SeverityPredictionResponse(**pred)


@router.get("", response_model=IncidentListResponse)
def list_incidents(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    incident_type: Optional[str] = None,
    severity: Optional[str] = None,
    incident_status: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(Incident)

    if incident_type:
        query = query.filter(Incident.type == incident_type)
    if severity:
        query = query.filter(Incident.severity == severity)
    if incident_status:
        query = query.filter(Incident.status == incident_status)

    total = query.count()
    incidents = (
        query.order_by(Incident.created_at.desc(), Incident.id.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
        .all()
    )

    return IncidentListResponse(
        incidents=[IncidentResponse.model_validate(i) for i in incidents],
        total=total,
        page=page,
        per_page=per_page,
    )


@router.get("/{incident_id}", response_model=IncidentResponse)
def get_incident(incident_id: int, db: Session = Depends(get_db)):
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Incident not found",
        )
    return IncidentResponse.model_validate(incident)


@router.post("", response_model=IncidentResponse, status_code=status.HTTP_201_CREATED)
def create_incident(
    incident_in: IncidentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    incident = incident_service.create_incident(
        db,
        type=incident_in.type,
        severity=incident_in.severity,
        description=incident_in.description,
        latitude=incident_in.latitude,
        longitude=incident_in.longitude,
        location_name=incident_in.location_name,
        image_url=incident_in.image_url,
        reporter_id=current_user.id,
    )
    return IncidentResponse.model_validate(incident)


@router.patch("/{incident_id}/verify", response_model=IncidentResponse)
def verify_incident(
    incident_id: int,
    verify_in: IncidentVerify,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Incident not found",
        )
    incident = incident_service.verify_incident(
        db, incident, current_user.id, verify_in.is_verified, verify_in.note
    )
    notification_service.notify_incident_status_change(
        db, incident, "reported", incident.status.value
    )
    return IncidentResponse.model_validate(incident)


@router.patch("/{incident_id}/resolve", response_model=IncidentResponse)
def resolve_incident(
    incident_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Incident not found",
        )
    old_status = incident.status.value
    incident = incident_service.update_incident_status(
        db, incident, IncidentStatus.resolved, current_user.id, "Incident resolved"
    )
    notification_service.notify_incident_status_change(db, incident, old_status, "resolved")
    return IncidentResponse.model_validate(incident)


@router.patch("/{incident_id}/reject", response_model=IncidentResponse)
def reject_incident(
    incident_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Incident not found",
        )
    old_status = incident.status.value
    incident = incident_service.update_incident_status(
        db, incident, IncidentStatus.rejected, current_user.id, "Incident rejected"
    )
    notification_service.notify_incident_status_change(db, incident, old_status, "rejected")
    return IncidentResponse.model_validate(incident)


@router.patch("/{incident_id}/severity", response_model=IncidentResponse)
def update_severity(
    incident_id: int,
    severity_in: IncidentSeverityUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Incident not found",
        )
    incident = incident_service.update_incident_severity(
        db, incident, severity_in.severity, current_user.id, severity_in.note
    )
    return IncidentResponse.model_validate(incident)
