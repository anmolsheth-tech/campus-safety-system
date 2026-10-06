from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_admin
from app.database.session import get_db
from app.models.incident import Incident
from app.models.user import User
from app.schemas.admin import AnalyticsResponse, DashboardStats
from app.schemas.auth import UserResponse
from app.schemas.incident import IncidentListResponse, IncidentResponse
from app.services import analytics_service

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/dashboard", response_model=DashboardStats)
def dashboard(
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    return analytics_service.get_dashboard_stats(db)


@router.get("/analytics", response_model=AnalyticsResponse)
def analytics(
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    return analytics_service.get_analytics(db)


@router.get("/users", response_model=List[UserResponse])
def list_users(
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    users = db.query(User).all()
    return [UserResponse.model_validate(u) for u in users]


@router.patch("/users/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    role: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    if role is not None:
        user.role = role
    if is_active is not None:
        user.is_active = is_active
    db.commit()
    db.refresh(user)
    return UserResponse.model_validate(user)


@router.get("/incidents", response_model=IncidentListResponse)
def list_all_incidents(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    query = db.query(Incident)
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


@router.get("/activity-logs")
def activity_logs(
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    from app.models.incident import IncidentUpdate

    updates = (
        db.query(IncidentUpdate)
        .order_by(IncidentUpdate.created_at.desc())
        .limit(50)
        .all()
    )
    return [
        {
            "id": u.id,
            "incident_id": u.incident_id,
            "user_id": u.user_id,
            "old_status": u.old_status,
            "new_status": u.new_status,
            "old_severity": u.old_severity,
            "new_severity": u.new_severity,
            "note": u.note,
            "created_at": u.created_at.isoformat() if u.created_at else None,
        }
        for u in updates
    ]
