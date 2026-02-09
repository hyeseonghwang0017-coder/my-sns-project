from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

# 댓글 생성 요청
class CommentCreate(BaseModel):
    content: Optional[str] = Field(None, max_length=500)
    image_url: Optional[str] = None
    parent_id: Optional[str] = None

# 댓글 수정 요청
class CommentUpdate(BaseModel):
    content: Optional[str] = Field(None, max_length=500)
    image_url: Optional[str] = None

# 댓글 응답
class CommentResponse(BaseModel):
    id: str
    post_id: str
    parent_id: Optional[str] = None
    author_id: str
    author_username: str
    author_display_name: str
    author_display_name_color: Optional[str] = "#000000"
    author_profile_image: Optional[str] = None
    content: str
    image_url: Optional[str] = None
    is_deleted: bool = False
    created_at: datetime
    updated_at: Optional[datetime] = None
