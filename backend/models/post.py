from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

# 게시글 생성 요청
class PostCreate(BaseModel):
    content: Optional[str] = Field(None, max_length=1000)
    image_url: Optional[str] = None
    category: Optional[str] = Field(default="전체", description="카테고리: 공지, 전체, 일상, 영화, 게임")

# 게시글 수정 요청
class PostUpdate(BaseModel):
    content: Optional[str] = Field(None, max_length=1000)
    image_url: Optional[str] = None
    category: Optional[str] = Field(None, description="카테고리: 공지, 전체, 일상, 영화, 게임")

# 게시글 응답
class PostResponse(BaseModel):
    id: str
    author_id: str
    author_username: str
    author_display_name: str
    author_display_name_color: Optional[str] = "#000000"
    author_profile_image: Optional[str] = None
    content: str
    category: str = "전체"
    image_url: Optional[str] = None
    likes_count: int
    liked_by: List[str] = Field(default_factory=list)
    created_at: datetime
    updated_at: Optional[datetime] = None
