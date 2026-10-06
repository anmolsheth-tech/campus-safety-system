from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class NotificationResponse(BaseModel):
    id: int
    user_id: int
    title: str
    message: str
    type: str
    is_read: bool
    incident_id: Optional[int] = None
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
