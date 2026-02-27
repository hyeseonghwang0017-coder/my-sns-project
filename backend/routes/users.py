from fastapi import APIRouter, HTTPException, Depends, status, Request
from models.user import UserCreate, UserLogin, UserResponse, UserUpdate, Token
from utils.auth import hash_password, verify_password, create_access_token, get_current_user
from utils.database import get_db
from datetime import datetime, timezone
from typing import Optional
from bson import ObjectId

router = APIRouter(prefix="/api/users", tags=["Users"])

def ensure_utc(dt: Optional[datetime]) -> Optional[datetime]:
    if dt is None:
        return None
    return dt if dt.tzinfo is not None else dt.replace(tzinfo=timezone.utc)

# 회원가입
@router.post("/signup", response_model=Token, status_code=status.HTTP_201_CREATED)
async def signup(user: UserCreate, request: Request):
    db = get_db(request)
    
    # 이메일 중복 체크
    existing_user = await db.users.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # 유저네임 중복 체크
    existing_username = await db.users.find_one({"username": user.username})
    if existing_username:
        raise HTTPException(status_code=400, detail="Username already taken")
    
    # 사용자 생성
    user_dict = {
        "username": user.username,
        "email": user.email,
        "password": hash_password(user.password),
        "display_name": user.display_name,
        "bio": user.bio,
        "profile_image": None,
        "created_at": datetime.now(timezone.utc),
        "followers": [],
        "following": []
    }
    
    result = await db.users.insert_one(user_dict)
    user_dict["id"] = str(result.inserted_id)
    
    # 토큰 생성
    access_token = create_access_token(data={"sub": user_dict["id"]})
    
    # 응답 생성
    user_response = UserResponse(
        id=user_dict["id"],
        username=user_dict["username"],
        email=user_dict["email"],
        display_name=user_dict["display_name"],
        display_name_color=user_dict.get("display_name_color", "#000000"),
        bio=user_dict["bio"],
        profile_image=user_dict["profile_image"],
        header_image=user_dict.get("header_image"),
        created_at=ensure_utc(user_dict["created_at"])
    )
    
    return Token(access_token=access_token, token_type="bearer", user=user_response)

# 로그인
@router.post("/login", response_model=Token)
async def login(user: UserLogin, request: Request):
    db = get_db(request)
    
    # 사용자 찾기
    db_user = await db.users.find_one({"email": user.email})
    if not db_user or not verify_password(user.password, db_user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # 토큰 생성
    access_token = create_access_token(data={"sub": str(db_user["_id"])})
    
    # 응답 생성
    user_response = UserResponse(
        id=str(db_user["_id"]),
        username=db_user["username"],
        email=db_user["email"],
        display_name=db_user["display_name"],
        display_name_color=db_user.get("display_name_color", "#000000"),
        bio=db_user.get("bio"),
        profile_image=db_user.get("profile_image"),
        header_image=db_user.get("header_image"),
        created_at=ensure_utc(db_user["created_at"])
    )
    
    return Token(access_token=access_token, token_type="bearer", user=user_response)

# 내 프로필 조회
@router.get("/me", response_model=UserResponse)
async def get_my_profile(request: Request, user_id: str = Depends(get_current_user)):
    db = get_db(request)
    
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return UserResponse(
        id=str(user["_id"]),
        username=user["username"],
        email=user["email"],
        display_name=user["display_name"],
        display_name_color=user.get("display_name_color", "#000000"),
        bio=user.get("bio"),
        profile_image=user.get("profile_image"),
        header_image=user.get("header_image"),
        created_at=ensure_utc(user["created_at"])
    )

# 내 프로필 수정
@router.put("/me", response_model=UserResponse)
async def update_my_profile(payload: UserUpdate, request: Request, user_id: str = Depends(get_current_user)):
    db = get_db(request)

    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    updates = {}

    if payload.username is not None:
        username = payload.username.strip()
        if username == "":
            raise HTTPException(status_code=400, detail="Username cannot be empty")
        if username != user["username"]:
            existing_username = await db.users.find_one({"username": username})
            if existing_username:
                raise HTTPException(status_code=400, detail="Username already taken")
        updates["username"] = username

    if payload.display_name is not None:
        display_name = payload.display_name.strip()
        if display_name == "":
            raise HTTPException(status_code=400, detail="Display name cannot be empty")
        updates["display_name"] = display_name

    if payload.bio is not None:
        updates["bio"] = payload.bio

    if updates:
        await db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": updates}
        )

    user = await db.users.find_one({"_id": ObjectId(user_id)})
    return UserResponse(
        id=str(user["_id"]),
        username=user["username"],
        email=user["email"],
        display_name=user["display_name"],
        display_name_color=user.get("display_name_color", "#000000"),
        bio=user.get("bio"),
        profile_image=user.get("profile_image"),
        header_image=user.get("header_image"),
        created_at=ensure_utc(user["created_at"])
    )

# 모든 유저 목록 조회 (닉네임, 프로필 사진만)
@router.get("/list", response_model=list[UserResponse])
async def get_all_users(request: Request, limit: int = 50):
    db = get_db(request)
    
    # 제외할 테스트 계정 목록
    excluded_usernames = ["fish", "fox", "fox2", "dog", "dog2", "cat", "test", "테스트유저", "duck", "test123"]
    excluded_emails = ["testuser@test123", "테스트유저@test123"]
    
    # 테스트 계정을 제외하고 생성일 기준 최신순으로 유저 목록 조회
    cursor = db.users.find({
        "username": {"$nin": excluded_usernames},
        "email": {"$nin": excluded_emails}
    }).sort("created_at", -1).limit(limit)
    users = await cursor.to_list(length=limit)
    
    return [
        UserResponse(
            id=str(user["_id"]),
            username=user["username"],
            email=user["email"],
            display_name=user["display_name"],
            display_name_color=user.get("display_name_color", "#000000"),
            bio=user.get("bio"),
            profile_image=user.get("profile_image"),
            header_image=user.get("header_image"),
            created_at=ensure_utc(user["created_at"])
        )
        for user in users
    ]
@router.post("/device-token")
async def save_device_token(
    token_data: dict,
    request: Request,
    user_id: str = Depends(get_current_user)
):
    db = get_db(request)
    
    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"device_token": token_data.get("device_token")}}
    )
    
    return {"message": "Device token saved"}