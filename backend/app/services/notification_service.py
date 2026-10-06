from typing import Optional

from sqlalchemy.orm import Session

from app.models.incident import Incident, IncidentStatus
from app.models.notification import Notification, NotificationType
from app.models.user import User


def create_notification(
    db: Session,
    *,
    user_id: int,
    title: str,
    message: str,
    notification_type: NotificationType = NotificationType.info,
    incident_id: Optional[int] = None,
) -> Notification:
    notif = Notification(
        user_id=user_id,
        title=title,
        message=message,
        type=notification_type,
        incident_id=incident_id,
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)
    return notif


def notify_incident_status_change(
    db: Session,
    incident: Incident,
    old_status: str,
    new_status: str,
) -> None:
    if new_status == IncidentStatus.verified.value or new_status == IncidentStatus.active.value:
        notif_type = NotificationType.warning
        title = f"Incident {new_status.replace('_', ' ').title()}"
        message = f"An incident of type '{incident.type.value}' at {incident.location_name or 'unknown location'} has been {new_status.replace('_', ' ')}."
    elif new_status == IncidentStatus.resolved.value:
        notif_type = NotificationType.success
        title = "Incident Resolved"
        message = f"The {incident.type.value} incident at {incident.location_name or 'unknown location'} has been resolved."
    elif new_status == IncidentStatus.rejected.value:
        notif_type = NotificationType.info
        title = "Incident Rejected"
        message = f"The reported {incident.type.value} incident has been rejected after review."
    else:
        return

    users = db.query(User).filter(User.is_active == True).all()
    for user in users:
        create_notification(
            db,
            user_id=user.id,
            title=title,
            message=message,
            notification_type=notif_type,
            incident_id=incident.id,
        )


def notify_route_warning(
    db: Session,
    user_id: int,
    risk_level: str,
    path_summary: str,
) -> Notification:
    if risk_level == "critical":
        notif_type = NotificationType.danger
        title = "Critical Risk Route"
        message = f"Your recommended route passes through a critical risk area. {path_summary}"
    elif risk_level == "high":
        notif_type = NotificationType.warning
        title = "High Risk Route"
        message = f"Your route has elevated risk. {path_summary}"
    else:
        notif_type = NotificationType.info
        title = "Route Info"
        message = f"Route calculated. {path_summary}"

    return create_notification(
        db,
        user_id=user_id,
        title=title,
        message=message,
        notification_type=notif_type,
    )


def create_sos_notifications(
    db: Session,
    incident: Incident,
    reporter: User,
) -> None:
    admins = db.query(User).filter(User.role == "admin", User.is_active == True).all()
    all_users = db.query(User).filter(
        User.is_active == True, User.id != reporter.id
    ).all()

    for admin in admins:
        create_notification(
            db,
            user_id=admin.id,
            title="SOS EMERGENCY ALERT",
            message=f"EMERGENCY: {reporter.full_name} triggered SOS at {incident.location_name or 'unknown location'}. Type: {incident.type.value}. Severity: {incident.severity.value}. Immediate response required!",
            notification_type=NotificationType.danger,
            incident_id=incident.id,
        )

    for user in all_users:
        create_notification(
            db,
            user_id=user.id,
            title="Emergency Alert",
            message=f"An emergency has been reported near {incident.location_name or 'your area'}. Please exercise caution and follow safety protocols.",
            notification_type=NotificationType.warning,
            incident_id=incident.id,
        )
