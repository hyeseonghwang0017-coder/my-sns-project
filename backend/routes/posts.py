from fastapi import APIRouter, HTTPException, Depends, status, Request
from models.post import PostCreate, PostUpdate, PostResponse
from models.comment import CommentCreate, CommentUpdate, CommentResponse
from utils.auth import get_current_user
from utils.database import get_db, parse_object_id
from datetime import datetime
from bson import ObjectId

router = APIRouter(prefix="/api/posts", tags=["Posts"])

async def build_post_response(post, db=None) -> PostResponse:
    liked_by = post.get("liked_by", [])
    author_profile_image = post.get("author_profile_image")
    author_display_name_color = post.get("author_display_name_color", "#000000")
    author_username = post.get("author_username", "")
    author_display_name = post.get("author_display_name", "")
    
    # 항상 최신 사용자 정보 조회 (색상 변경 반영)
    if db is not None and post.get("author_id"):
        try:
            user = await db.users.find_one({"_id": ObjectId(post["author_id"])})
            if user:
                author_username = user.get("username", author_username)
                author_display_name = user.get("display_name", author_display_name)
                if user.get("profile_image"):
                    author_profile_image = user.get("profile_image")
                author_display_name_color = user.get("display_name_color", "#000000")
        except:
            pass
    
    return PostResponse(
        id=str(post["_id"]),
        author_id=post["author_id"],
        author_username=author_username,
        author_display_name=author_display_name,
        author_display_name_color=author_display_name_color,
        author_profile_image=author_profile_image,
        content=post.get("content", ""),
        image_url=post.get("image_url"),
        category=post.get("category", "전체"),
        likes_count=len(liked_by),
        liked_by=liked_by,
        created_at=post["created_at"],
        updated_at=post.get("updated_at"),
    )

async def build_comment_response(comment, db=None) -> CommentResponse:
    author_profile_image = comment.get("author_profile_image")
    author_display_name_color = comment.get("author_display_name_color", "#000000")
    author_username = comment.get("author_username", "")
    author_display_name = comment.get("author_display_name", "")
    
    # 항상 최신 사용자 정보 조회 (색상 변경 반영)
    if db is not None and comment.get("author_id"):
        try:
            user = await db.users.find_one({"_id": ObjectId(comment["author_id"])})
            if user:
                author_username = user.get("username", author_username)
                author_display_name = user.get("display_name", author_display_name)
                if user.get("profile_image"):
                    author_profile_image = user.get("profile_image")
                author_display_name_color = user.get("display_name_color", "#000000")
        except:
            pass
    
    return CommentResponse(
        id=str(comment["_id"]),
        post_id=comment["post_id"],
        parent_id=comment.get("parent_id"),
        author_id=comment["author_id"],
        author_username=author_username,
        author_display_name=author_display_name,
        author_display_name_color=author_display_name_color,
        author_profile_image=author_profile_image,
        content=comment.get("content", ""),
        image_url=comment.get("image_url"),
        is_deleted=comment.get("is_deleted", False),
        created_at=comment["created_at"],
        updated_at=comment.get("updated_at"),
    )

@router.post("/", response_model=PostResponse, status_code=status.HTTP_201_CREATED)
async def create_post(payload: PostCreate, request: Request, user_id: str = Depends(get_current_user)):
    db = get_db(request)
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    content = (payload.content or "").strip()
    if content == "" and not payload.image_url:
        raise HTTPException(status_code=400, detail="Content or image is required")
    
    # 카테고리 유효성 검증
    valid_categories = ["공지", "전체", "일상", "영화", "게임"]
    category = payload.category or "전체"
    if category not in valid_categories:
        raise HTTPException(status_code=400, detail=f"Invalid category. Must be one of: {', '.join(valid_categories)}")

    post_doc = {
        "author_id": user_id,
        "author_username": user["username"],
        "author_display_name": user["display_name"],
        "author_profile_image": user.get("profile_image"),
        "content": content,
        "image_url": payload.image_url,
        "category": category,
        "liked_by": [],
        "created_at": datetime.utcnow(),
        "updated_at": None,
    }

    result = await db.posts.insert_one(post_doc)
    post_doc["_id"] = result.inserted_id

    return await build_post_response(post_doc, db)

@router.get("/", response_model=list[PostResponse])
async def list_posts(request: Request, page: int = 1, limit: int = 1000, category: str = None):
    db = get_db(request)
    skip = (page - 1) * limit
    
    # 카테고리 필터링
    query = {}
    if category and category != "전체":
        query["category"] = category
    
    cursor = db.posts.find(query).sort("created_at", -1).skip(skip).limit(limit)
    posts = await cursor.to_list(length=limit)

    return [await build_post_response(post, db) for post in posts]

@router.get("/meta/count")
async def get_posts_count(request: Request):
    db = get_db(request)
    count = await db.posts.count_documents({})
    return {"total": count}

@router.get("/{post_id}", response_model=PostResponse)
async def get_post(post_id: str, request: Request):
    db = get_db(request)
    post = await db.posts.find_one({"_id": parse_object_id(post_id)})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    return await build_post_response(post, db)

@router.put("/{post_id}", response_model=PostResponse)
async def update_post(post_id: str, payload: PostUpdate, request: Request, user_id: str = Depends(get_current_user)):
    content = payload.content
    if content is not None:
        content = content.strip()

    if (content is None or content == "") and payload.image_url is None:
        raise HTTPException(status_code=400, detail="Content or image is required")

    db = get_db(request)
    post = await db.posts.find_one({"_id": parse_object_id(post_id)})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    if post["author_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not allowed")

    updated_at = datetime.utcnow()
    updates = {"updated_at": updated_at}
    if content is not None:
        updates["content"] = content
    if payload.image_url is not None:
        updates["image_url"] = payload.image_url
    if payload.category is not None:
        # 카테고리 유효성 검증
        valid_categories = ["공지", "전체", "일상", "영화", "게임"]
        if payload.category not in valid_categories:
            raise HTTPException(status_code=400, detail=f"Invalid category. Must be one of: {', '.join(valid_categories)}")
        updates["category"] = payload.category
    await db.posts.update_one(
        {"_id": post["_id"]},
        {"$set": updates},
    )

    if content is not None:
        post["content"] = content
    if payload.image_url is not None:
        post["image_url"] = payload.image_url
    if payload.category is not None:
        post["category"] = payload.category
    post["updated_at"] = updated_at

    return await build_post_response(post, db)

@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_post(post_id: str, request: Request, user_id: str = Depends(get_current_user)):
    db = get_db(request)
    post = await db.posts.find_one({"_id": parse_object_id(post_id)})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    if post["author_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not allowed")

    await db.posts.delete_one({"_id": post["_id"]})
    return None

@router.post("/{post_id}/like", response_model=PostResponse)
async def like_post(post_id: str, request: Request, user_id: str = Depends(get_current_user)):
    db = get_db(request)
    post = await db.posts.find_one({"_id": parse_object_id(post_id)})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    # 이미 좋아요 했는지 확인
    already_liked = user_id in post.get("liked_by", [])

    await db.posts.update_one(
        {"_id": post["_id"]},
        {"$addToSet": {"liked_by": user_id}},
    )

    # 처음 좋아요 한 경우만 알림 생성
    if not already_liked and post["author_id"] != user_id:
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        await db.notifications.insert_one({
            "recipient_id": post["author_id"],
            "actor_id": user_id,
            "actor_username": user["username"],
            "actor_display_name": user["display_name"],
            "type": "like",
            "post_id": post_id,
            "comment_id": None,
            "message": f"{user['display_name']}님이 게시글에 좋아요를 눌렀습니다.",
            "is_read": False,
            "created_at": datetime.utcnow(),
            "updated_at": None,
        })

    post = await db.posts.find_one({"_id": post["_id"]})
    return await build_post_response(post, db)

@router.delete("/{post_id}/like", response_model=PostResponse)
async def unlike_post(post_id: str, request: Request, user_id: str = Depends(get_current_user)):
    db = get_db(request)
    post = await db.posts.find_one({"_id": parse_object_id(post_id)})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    await db.posts.update_one(
        {"_id": post["_id"]},
        {"$pull": {"liked_by": user_id}},
    )

    post = await db.posts.find_one({"_id": post["_id"]})
    return await build_post_response(post, db)

@router.get("/{post_id}/comments", response_model=list[CommentResponse])
async def list_comments(post_id: str, request: Request):
    db = get_db(request)
    post = await db.posts.find_one({"_id": parse_object_id(post_id)})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    cursor = db.comments.find({"post_id": post_id}).sort("created_at", 1)
    comments = await cursor.to_list(length=500)
    
    # soft delete된 댓글 중 자식이 없는 것들 삭제
    for comment in comments:
        if comment.get("is_deleted") and comment.get("parent_id") is None:
            # 부모가 soft delete 상태이고 자식이 있는지 확인
            child_count = await db.comments.count_documents({"parent_id": str(comment["_id"])})
            if child_count == 0:
                # 자식이 없으면 완전 삭제
                await db.comments.delete_one({"_id": comment["_id"]})
    
    # 다시 조회해서 반환
    cursor = db.comments.find({"post_id": post_id}).sort("created_at", 1)
    comments = await cursor.to_list(length=500)
    return [await build_comment_response(comment, db) for comment in comments]

@router.post("/{post_id}/comments", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
async def create_comment(post_id: str, payload: CommentCreate, request: Request, user_id: str = Depends(get_current_user)):
    db = get_db(request)
    post = await db.posts.find_one({"_id": parse_object_id(post_id)})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    parent_id = payload.parent_id
    if parent_id:
        parent = await db.comments.find_one({"_id": parse_object_id(parent_id)})
        if not parent or parent["post_id"] != post_id:
            raise HTTPException(status_code=400, detail="Invalid parent comment")

    content = (payload.content or "").strip()
    if content == "" and not payload.image_url:
        raise HTTPException(status_code=400, detail="Content or image is required")

    comment_doc = {
        "post_id": post_id,
        "parent_id": parent_id,
        "author_id": user_id,
        "author_username": user["username"],
        "author_display_name": user["display_name"],
        "author_profile_image": user.get("profile_image"),
        "content": content,
        "image_url": payload.image_url,
        "is_deleted": False,
        "created_at": datetime.utcnow(),
        "updated_at": None,
    }

    result = await db.comments.insert_one(comment_doc)
    comment_doc["_id"] = result.inserted_id
    
    # 알림 생성
    if parent_id:
        # 대댓글: 부모 댓글 작성자에게 알림
        recipient_id = parent["author_id"]
        notification_type = "reply"
        message = f"{user['display_name']}님이 댓글에 대댓글을 남겼습니다."
    else:
        # 댓글: 게시글 작성자에게 알림
        recipient_id = post["author_id"]
        notification_type = "comment"
        message = f"{user['display_name']}님이 게시글에 댓글을 남겼습니다."
    
    # 자신의 게시글/댓글에는 알림 안 함
    if recipient_id != user_id:
        await db.notifications.insert_one({
            "recipient_id": recipient_id,
            "actor_id": user_id,
            "actor_username": user["username"],
            "actor_display_name": user["display_name"],
            "type": notification_type,
            "post_id": post_id,
            "comment_id": str(comment_doc["_id"]) if parent_id else None,
            "message": message,
            "is_read": False,
            "created_at": datetime.utcnow(),
            "updated_at": None,
        })
    
    return await build_comment_response(comment_doc, db)

@router.put("/{post_id}/comments/{comment_id}", response_model=CommentResponse)
async def update_comment(post_id: str, comment_id: str, payload: CommentUpdate, request: Request, user_id: str = Depends(get_current_user)):
    db = get_db(request)
    comment = await db.comments.find_one({"_id": parse_object_id(comment_id)})
    if not comment or comment["post_id"] != post_id:
        raise HTTPException(status_code=404, detail="Comment not found")

    if comment["author_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not allowed")

    content = payload.content
    if content is not None:
        content = content.strip()

    if (content is None or content == "") and payload.image_url is None:
        raise HTTPException(status_code=400, detail="Content or image is required")

    updated_at = datetime.utcnow()
    updates = {"updated_at": updated_at}
    if content is not None:
        updates["content"] = content
    if payload.image_url is not None:
        updates["image_url"] = payload.image_url
    await db.comments.update_one(
        {"_id": comment["_id"]},
        {"$set": updates},
    )

    if content is not None:
        comment["content"] = content
    if payload.image_url is not None:
        comment["image_url"] = payload.image_url
    comment["updated_at"] = updated_at
    return await build_comment_response(comment, db)

@router.delete("/{post_id}/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_comment(post_id: str, comment_id: str, request: Request, user_id: str = Depends(get_current_user)):
    db = get_db(request)
    comment = await db.comments.find_one({"_id": parse_object_id(comment_id)})
    if not comment or comment["post_id"] != post_id:
        raise HTTPException(status_code=404, detail="Comment not found")

    if comment["author_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not allowed")

    # 대댓글이 있는지 확인
    has_replies = await db.comments.count_documents({"parent_id": comment_id}) > 0

    if has_replies:
        # 대댓글이 있으면 소프트 삭제
        await db.comments.update_one(
            {"_id": comment["_id"]},
            {"$set": {
                "is_deleted": True,
                "content": "",
                "image_url": None,
                "updated_at": datetime.utcnow()
            }}
        )
    else:
        # 대댓글이 없으면 완전 삭제
        await db.comments.delete_one({"_id": comment["_id"]})
        
        # 부모 댓글이 있으면 부모도 확인
        if comment.get("parent_id"):
            parent_id = comment["parent_id"]
            parent = await db.comments.find_one({"_id": parse_object_id(parent_id)})
            
            if parent and parent.get("is_deleted"):
                # 부모가 soft delete 상태인 경우, 부모의 남은 대댓글 확인
                remaining_replies = await db.comments.count_documents({"parent_id": parent_id})
                
                if remaining_replies == 0:
                    # 대댓글이 모두 삭제되었으면 부모도 완전 삭제
                    await db.comments.delete_one({"_id": parent["_id"]})

    return None
