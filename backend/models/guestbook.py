from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

# 방명록 작성 요청
class GuestbookCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=500)

# 방명록 수정 요청
class GuestbookUpdate(BaseModel):
    content: str = Field(..., min_length=1, max_length=500)

# 방명록 응답
class GuestbookResponse(BaseModel):
    id: str
    profile_user_id: str  # 프로필 주인
    author_id: str  # 방명록 작성자
    author_username: str
    author_display_name: str
    author_profile_image: Optional[str] = None
    content: str
    created_at: datetime
    updated_at: Optional[datetime] = None
