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

# 사용자 응답 (비밀번호 제외)
class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    display_name: str
    bio: Optional[str] = None
    profile_image: Optional[str] = None
    created_at: datetime

# 토큰 응답
class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse