from fastapi import APIRouter, HTTPException, Depends, status, Request
from models.user import UserCreate, UserLogin, UserResponse, Token
from utils.auth import hash_password, verify_password, create_access_token, get_current_user
from datetime import datetime
from bson import ObjectId

router = APIRouter(prefix="/api/users", tags=["Users"])

def get_db(request):
    return request.app.mongodb

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
        "created_at": datetime.utcnow(),
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
        bio=user_dict["bio"],
        profile_image=user_dict["profile_image"],
        created_at=user_dict["created_at"]
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
        bio=db_user.get("bio"),
        profile_image=db_user.get("profile_image"),
        created_at=db_user["created_at"]
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
        bio=user.get("bio"),
        profile_image=user.get("profile_image"),
        created_at=user["created_at"]
    )