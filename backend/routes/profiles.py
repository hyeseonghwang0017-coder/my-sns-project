from fastapi import APIRouter, HTTPException, Depends, status, Request, Body
from models.guestbook import GuestbookCreate, GuestbookUpdate, GuestbookResponse
from utils.auth import get_current_user
from utils.database import get_db, parse_object_id
from typing import Dict
from datetime import datetime
from bson import ObjectId

router = APIRouter(prefix="/api/profiles", tags=["Profiles"])

# 사용자 프로필 조회
@router.get("/{user_id}")
async def get_user_profile(user_id: str, request: Request):
    db = get_db(request)
    user = await db.users.find_one({"_id": parse_object_id(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "id": str(user["_id"]),
        "username": user["username"],
        "display_name": user["display_name"],
        "display_name_color": user.get("display_name_color", "#000000"),
        "bio": user.get("bio"),
        "profile_image": user.get("profile_image"),
        "header_image": user.get("header_image"),
        "created_at": user["created_at"],
    }

# 프로필 사진 업데이트
@router.put("/{user_id}/profile-image")
async def update_profile_image(user_id: str, image_url: str, request: Request, current_user_id: str = Depends(get_current_user)):
    if user_id != current_user_id:
        raise HTTPException(status_code=403, detail="Not allowed")
    
    db = get_db(request)
    await db.users.update_one(
        {"_id": parse_object_id(user_id)},
        {"$set": {"profile_image": image_url}}
    )
    
    user = await db.users.find_one({"_id": parse_object_id(user_id)})
    return {
        "id": str(user["_id"]),
        "username": user["username"],
        "display_name": user["display_name"],
        "display_name_color": user.get("display_name_color", "#000000"),
        "bio": user.get("bio"),
        "profile_image": user.get("profile_image"),
        "header_image": user.get("header_image"),
        "created_at": user["created_at"],
    }

# 헤더 이미지 업데이트
@router.put("/{user_id}/header-image")
async def update_header_image(user_id: str, image_url: str, request: Request, current_user_id: str = Depends(get_current_user)):
    if user_id != current_user_id:
        raise HTTPException(status_code=403, detail="Not allowed")
    
    db = get_db(request)
    await db.users.update_one(
        {"_id": parse_object_id(user_id)},
        {"$set": {"header_image": image_url}}
    )
    
    user = await db.users.find_one({"_id": parse_object_id(user_id)})
    return {
        "id": str(user["_id"]),
        "username": user["username"],
        "display_name": user["display_name"],
        "display_name_color": user.get("display_name_color", "#000000"),
        "bio": user.get("bio"),
        "profile_image": user.get("profile_image"),
        "header_image": user.get("header_image"),
        "created_at": user["created_at"],
    }

@router.put("/{user_id}/display-name-color")
async def update_display_name_color(user_id: str, body: Dict = Body(...), request: Request = None, current_user_id: str = Depends(get_current_user)):
    if user_id != current_user_id:
        raise HTTPException(status_code=403, detail="Not allowed")
    
    color = body.get("color", "#000000")
    
    db = request.app.mongodb
    await db.users.update_one(
        {"_id": parse_object_id(user_id)},
        {"$set": {"display_name_color": color}}
    )
    
    user = await db.users.find_one({"_id": parse_object_id(user_id)})
    return {
        "id": str(user["_id"]),
        "username": user["username"],
        "display_name": user["display_name"],
        "display_name_color": user.get("display_name_color", "#000000"),
        "bio": user.get("bio"),
        "profile_image": user.get("profile_image"),
        "header_image": user.get("header_image"),
        "created_at": user["created_at"],
    }

# 사용자별 게시글 조회
@router.get("/{user_id}/posts")
async def get_user_posts(user_id: str, request: Request):
    db = get_db(request)
    user = await db.users.find_one({"_id": parse_object_id(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    cursor = db.posts.find({"author_id": user_id}).sort("created_at", -1)
    posts = await cursor.to_list(length=100)
    
    result = []
    author_username = user.get("username", "")
    author_display_name = user.get("display_name", "")
    for post in posts:
        liked_by = post.get("liked_by", [])
        author_profile_image = post.get("author_profile_image")
        
        # author_profile_image가 없으면 user collection에서 조회
        if not author_profile_image:
            try:
                post_author = await db.users.find_one({"_id": ObjectId(post["author_id"])})
                if post_author:
                    author_profile_image = post_author.get("profile_image")
            except:
                pass
        
        result.append({
            "id": str(post["_id"]),
            "author_id": post["author_id"],
            "author_username": author_username,
            "author_display_name": author_display_name,
            "author_profile_image": author_profile_image,
            "content": post.get("content", ""),
            "image_url": post.get("image_url"),
            "likes_count": len(liked_by),
            "liked_by": liked_by,
            "created_at": post["created_at"],
            "updated_at": post.get("updated_at"),
        })
    return result

# 방명록 조회
@router.get("/{user_id}/guestbook", response_model=list[GuestbookResponse])
async def get_guestbook(user_id: str, request: Request):
    db = get_db(request)
    user = await db.users.find_one({"_id": parse_object_id(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    cursor = db.guestbook.find({"profile_user_id": user_id}).sort("created_at", -1)
    entries = await cursor.to_list(length=100)
    
    author_ids = list({entry["author_id"] for entry in entries})
    authors = await db.users.find({"_id": {"$in": [ObjectId(aid) for aid in author_ids]}}).to_list(length=200)
    author_map = {str(author["_id"]): author for author in authors}

    return [
        GuestbookResponse(
            id=str(entry["_id"]),
            profile_user_id=entry["profile_user_id"],
            author_id=entry["author_id"],
            author_username=author_map.get(entry["author_id"], {}).get("username", entry.get("author_username", "")),
            author_display_name=author_map.get(entry["author_id"], {}).get("display_name", entry.get("author_display_name", "")),
            author_profile_image=author_map.get(entry["author_id"], {}).get("profile_image", entry.get("author_profile_image")),
            content=entry["content"],
            created_at=entry["created_at"],
            updated_at=entry.get("updated_at"),
        )
        for entry in entries
    ]

# 방명록 작성
@router.post("/{user_id}/guestbook", response_model=GuestbookResponse, status_code=status.HTTP_201_CREATED)
async def create_guestbook_entry(user_id: str, payload: GuestbookCreate, request: Request, current_user_id: str = Depends(get_current_user)):
    db = get_db(request)
    
    # 프로필 주인 확인
    profile_user = await db.users.find_one({"_id": parse_object_id(user_id)})
    if not profile_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # 작성자 정보
    author = await db.users.find_one({"_id": ObjectId(current_user_id)})
    if not author:
        raise HTTPException(status_code=404, detail="Author not found")
    
    entry_doc = {
        "profile_user_id": user_id,
        "author_id": current_user_id,
        "author_username": author["username"],
        "author_display_name": author["display_name"],
        "author_profile_image": author.get("profile_image"),
        "content": payload.content,
        "created_at": datetime.utcnow(),
        "updated_at": None,
    }
    
    result = await db.guestbook.insert_one(entry_doc)
    entry_doc["_id"] = result.inserted_id
    
    # 알림 생성 (자신의 방명록에는 알림 안 함)
    if user_id != current_user_id:
        await db.notifications.insert_one({
            "recipient_id": user_id,
            "actor_id": current_user_id,
            "actor_username": author["username"],
            "actor_display_name": author["display_name"],
            "type": "guestbook",
            "post_id": None,
            "comment_id": None,
            "message": f"{author['display_name']}님이 방명록에 글을 남겼습니다.",
            "is_read": False,
            "created_at": datetime.utcnow(),
            "updated_at": None,
        })
    
    return GuestbookResponse(
        id=str(entry_doc["_id"]),
        profile_user_id=entry_doc["profile_user_id"],
        author_id=entry_doc["author_id"],
        author_username=entry_doc["author_username"],
        author_display_name=entry_doc["author_display_name"],
        author_profile_image=entry_doc.get("author_profile_image"),
        content=entry_doc["content"],
        created_at=entry_doc["created_at"],
        updated_at=entry_doc.get("updated_at"),
    )

# 방명록 수정
@router.put("/{user_id}/guestbook/{entry_id}", response_model=GuestbookResponse)
async def update_guestbook_entry(user_id: str, entry_id: str, payload: GuestbookUpdate, request: Request, current_user_id: str = Depends(get_current_user)):
    db = get_db(request)
    
    entry = await db.guestbook.find_one({"_id": parse_object_id(entry_id)})
    if not entry or entry["profile_user_id"] != user_id:
        raise HTTPException(status_code=404, detail="Guestbook entry not found")
    
    if entry["author_id"] != current_user_id:
        raise HTTPException(status_code=403, detail="Not allowed")
    
    updated_at = datetime.utcnow()
    await db.guestbook.update_one(
        {"_id": entry["_id"]},
        {"$set": {"content": payload.content, "updated_at": updated_at}}
    )
    
    entry["content"] = payload.content
    entry["updated_at"] = updated_at
    
    return GuestbookResponse(
        id=str(entry["_id"]),
        profile_user_id=entry["profile_user_id"],
        author_id=entry["author_id"],
        author_username=entry["author_username"],
        author_display_name=entry["author_display_name"],
        author_profile_image=entry.get("author_profile_image"),
        content=entry["content"],
        created_at=entry["created_at"],
        updated_at=entry.get("updated_at"),
    )

# 방명록 삭제
@router.delete("/{user_id}/guestbook/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_guestbook_entry(user_id: str, entry_id: str, request: Request, current_user_id: str = Depends(get_current_user)):
    db = get_db(request)
    
    entry = await db.guestbook.find_one({"_id": parse_object_id(entry_id)})
    if not entry or entry["profile_user_id"] != user_id:
        raise HTTPException(status_code=404, detail="Guestbook entry not found")
    
    if entry["author_id"] != current_user_id:
        raise HTTPException(status_code=403, detail="Not allowed")
    
    await db.guestbook.delete_one({"_id": entry["_id"]})
    return None
