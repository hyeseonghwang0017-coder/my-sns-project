from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

# 게시글 생성 요청
class PostCreate(BaseModel):
    content: Optional[str] = Field(None, max_length=1000)
    image_url: Optional[str] = None

# 게시글 수정 요청
class PostUpdate(BaseModel):
    content: Optional[str] = Field(None, max_length=1000)
    image_url: Optional[str] = None

# 게시글 응답
class PostResponse(BaseModel):
    id: str
    author_id: str
    author_username: str
    author_display_name: str
    author_profile_image: Optional[str] = None
    content: str
    image_url: Optional[str] = None
    likes_count: int
    liked_by: List[str] = Field(default_factory=list)
    created_at: datetime
    updated_at: Optional[datetime] = None
