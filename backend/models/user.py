from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

# 회원가입 요청
class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=20)
    email: EmailStr
    password: str = Field(..., min_length=6)
    display_name: str = Field(..., min_length=2, max_length=30)
    bio: Optional[str] = None

# 로그인 요청
class UserLogin(BaseModel):
    email: EmailStr
    password: str

# 프로필 수정 요청
class UserUpdate(BaseModel):
    username: Optional[str] = Field(None, min_length=3, max_length=20)
    display_name: Optional[str] = Field(None, min_length=2, max_length=30)
    bio: Optional[str] = None

# 사용자 응답 (비밀번호 제외)
class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    display_name: str
    display_name_color: Optional[str] = "#000000"
    bio: Optional[str] = None
    profile_image: Optional[str] = None
    header_image: Optional[str] = None
    created_at: datetime

# 토큰 응답
class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse