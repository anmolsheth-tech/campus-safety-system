from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.incident import Incident, IncidentSeverity, IncidentStatus, IncidentType
from app.models.user import User


def get_dashboard_stats(db: Session) -> Dict[str, Any]:
    total_incidents = db.query(func.count(Incident.id)).scalar() or 0
    active_incidents = (
        db.query(func.count(Incident.id))
        .filter(
            Incident.status.in_([
                IncidentStatus.reported,
                IncidentStatus.verified,
                IncidentStatus.active,
            ])
        )
        .scalar()
        or 0
    )
    resolved_incidents = (
        db.query(func.count(Incident.id))
        .filter(Incident.status == IncidentStatus.resolved)
        .scalar()
        or 0
    )
    total_users = db.query(func.count(User.id)).scalar() or 0

    type_counts = {}
    for t in IncidentType:
        count = (
            db.query(func.count(Incident.id))
            .filter(Incident.type == t)
            .scalar()
            or 0
        )
        type_counts[t.value] = count

    severity_counts = {}
    for s in IncidentSeverity:
        count = (
            db.query(func.count(Incident.id))
            .filter(Incident.severity == s)
            .scalar()
            or 0
        )
        severity_counts[s.value] = count

    status_counts = {}
    for s in IncidentStatus:
        count = (
            db.query(func.count(Incident.id))
            .filter(Incident.status == s)
            .scalar()
            or 0
        )
        status_counts[s.value] = count

    recent = (
        db.query(Incident)
        .order_by(Incident.created_at.desc())
        .limit(10)
        .all()
    )
    recent_incidents = [
        {
            "id": inc.id,
            "type": inc.type.value,
            "severity": inc.severity.value,
            "status": inc.status.value,
            "location_name": inc.location_name,
            "created_at": inc.created_at.isoformat() if inc.created_at else None,
        }
        for inc in recent
    ]

    now = datetime.now(timezone.utc)
    monthly_trend = []
    for i in range(5, -1, -1):
        month_start = (now - timedelta(days=30 * i)).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        month_end = month_start + timedelta(days=30)
        count = (
            db.query(func.count(Incident.id))
            .filter(Incident.created_at >= month_start, Incident.created_at < month_end)
            .scalar()
            or 0
        )
        monthly_trend.append({
            "month": month_start.strftime("%b %Y"),
            "count": count,
        })

    return {
        "total_incidents": total_incidents,
        "active_incidents": active_incidents,
        "resolved_incidents": resolved_incidents,
        "total_users": total_users,
        "incidents_by_type": type_counts,
        "incidents_by_severity": severity_counts,
        "incidents_by_status": status_counts,
        "recent_incidents": recent_incidents,
        "monthly_trend": monthly_trend,
    }


def get_analytics(db: Session) -> Dict[str, Any]:
    now = datetime.now(timezone.utc)
    thirty_days_ago = now - timedelta(days=30)

    recent_incidents = (
        db.query(Incident)
        .filter(Incident.created_at >= thirty_days_ago)
        .all()
    )

    daily_counts: Dict[str, int] = {}
    for inc in recent_incidents:
        if inc.created_at:
            day = inc.created_at.strftime("%Y-%m-%d")
            daily_counts[day] = daily_counts.get(day, 0) + 1

    incidents_per_day = [
        {"date": day, "count": count}
        for day, count in sorted(daily_counts.items())
    ]

    resolved = (
        db.query(Incident)
        .filter(
            Incident.status == IncidentStatus.resolved,
            Incident.resolved_at.isnot(None),
            Incident.created_at >= thirty_days_ago,
        )
        .all()
    )

    total_resolution_hours = 0.0
    for inc in resolved:
        if inc.resolved_at and inc.created_at:
            delta = inc.resolved_at - inc.created_at
            total_resolution_hours += delta.total_seconds() / 3600.0

    avg_resolution = total_resolution_hours / max(len(resolved), 1)

    location_risk: Dict[str, int] = {}
    for inc in recent_incidents:
        loc = inc.location_name or "Unknown"
        location_risk[loc] = location_risk.get(loc, 0) + 1

    most_affected = [
        {"location": loc, "count": count}
        for loc, count in sorted(location_risk.items(), key=lambda x: x[1], reverse=True)[:10]
    ]

    severity_dist = {}
    for s in IncidentSeverity:
        severity_dist[s.value] = sum(1 for i in recent_incidents if i.severity == s)

    type_dist = {}
    for t in IncidentType:
        type_dist[t.value] = sum(1 for i in recent_incidents if i.type == t)

    total = db.query(func.count(Incident.id)).scalar() or 0
    reviewed = (
        db.query(func.count(Incident.id))
        .filter(Incident.status != IncidentStatus.reported)
        .scalar()
        or 0
    )
    response_rate = reviewed / max(total, 1)

    return {
        "incidents_per_day": incidents_per_day,
        "avg_resolution_time_hours": round(avg_resolution, 2),
        "most_affected_areas": most_affected,
        "severity_distribution": severity_dist,
        "type_distribution": type_dist,
        "response_rate": round(response_rate, 3),
    }
