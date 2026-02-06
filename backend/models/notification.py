from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class NotificationCreate(BaseModel):
    recipient_id: str  # 알림을 받을 사용자
    actor_id: str  # 액션을 한 사용자
    actor_username: str
    actor_display_name: str
    type: str  # 'comment', 'reply', 'like', 'guestbook'
    post_id: Optional[str] = None  # comment, reply, like의 경우
    comment_id: Optional[str] = None  # reply의 경우
    message: str  # 알림 메시지

class NotificationResponse(BaseModel):
    id: str
    recipient_id: str
    actor_id: str
    actor_username: str
    actor_display_name: str
    type: str
    post_id: Optional[str] = None
    comment_id: Optional[str] = None
    message: str
    is_read: bool = False
    created_at: datetime
    updated_at: Optional[datetime] = None

class NotificationUpdate(BaseModel):
    is_read: Optional[bool] = None
