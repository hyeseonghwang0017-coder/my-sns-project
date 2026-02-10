from fastapi import APIRouter, HTTPException, Depends, status, Request
from models.notification import NotificationCreate, NotificationResponse, NotificationUpdate
from utils.auth import get_current_user
from utils.database import get_db, parse_object_id
from datetime import datetime, timezone
from typing import Optional
from bson import ObjectId

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])

def ensure_utc(dt: Optional[datetime]) -> Optional[datetime]:
    if dt is None:
        return None
    return dt if dt.tzinfo is not None else dt.replace(tzinfo=timezone.utc)

def build_notification_response(notification) -> NotificationResponse:
    return NotificationResponse(
        id=str(notification["_id"]),
        recipient_id=notification["recipient_id"],
        actor_id=notification["actor_id"],
        actor_username=notification.get("actor_username", ""),
        actor_display_name=notification.get("actor_display_name", ""),
        type=notification["type"],
        post_id=notification.get("post_id"),
        comment_id=notification.get("comment_id"),
        message=notification["message"],
        is_read=notification.get("is_read", False),
        created_at=ensure_utc(notification["created_at"]),
        updated_at=ensure_utc(notification.get("updated_at")),
    )

@router.get("/", response_model=list[NotificationResponse])
async def get_notifications(request: Request, user_id: str = Depends(get_current_user)):
    db = get_db(request)
    cursor = db.notifications.find({"recipient_id": user_id}).sort("created_at", -1)
    notifications = await cursor.to_list(length=100)

    actor_ids = list({n.get("actor_id") for n in notifications if n.get("actor_id")})
    actors = await db.users.find({"_id": {"$in": [ObjectId(aid) for aid in actor_ids]}}).to_list(length=200)
    actor_map = {str(actor["_id"]): actor for actor in actors}

    responses = []
    for n in notifications:
        actor = actor_map.get(n.get("actor_id"))
        if actor:
            n = {
                **n,
                "actor_username": actor.get("username", n.get("actor_username", "")),
                "actor_display_name": actor.get("display_name", n.get("actor_display_name", "")),
            }
        responses.append(build_notification_response(n))
    return responses

@router.get("/unread/count")
async def get_unread_count(request: Request, user_id: str = Depends(get_current_user)):
    db = get_db(request)
    count = await db.notifications.count_documents({"recipient_id": user_id, "is_read": False})
    return {"unread_count": count}

@router.put("/{notification_id}", response_model=NotificationResponse)
async def update_notification(
    notification_id: str,
    payload: NotificationUpdate,
    request: Request,
    user_id: str = Depends(get_current_user)
):
    db = get_db(request)
    notification = await db.notifications.find_one({"_id": parse_object_id(notification_id)})
    
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    if notification["recipient_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not allowed")
    
    updates = {"updated_at": datetime.now(timezone.utc)}
    if payload.is_read is not None:
        updates["is_read"] = payload.is_read
    
    await db.notifications.update_one(
        {"_id": notification["_id"]},
        {"$set": updates}
    )
    
    notification = await db.notifications.find_one({"_id": notification["_id"]})
    return build_notification_response(notification)

@router.delete("/{notification_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_notification(
    notification_id: str,
    request: Request,
    user_id: str = Depends(get_current_user)
):
    db = get_db(request)
    notification = await db.notifications.find_one({"_id": parse_object_id(notification_id)})
    
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    if notification["recipient_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not allowed")
    
    await db.notifications.delete_one({"_id": notification["_id"]})
    return None

@router.delete("/", status_code=status.HTTP_204_NO_CONTENT)
async def delete_all_notifications(
    request: Request,
    user_id: str = Depends(get_current_user)
):
    db = get_db(request)
    await db.notifications.delete_many({"recipient_id": user_id})
    return None

@router.post("/", response_model=NotificationResponse, status_code=status.HTTP_201_CREATED)
async def create_notification(payload: NotificationCreate, request: Request):
    """내부용 알림 생성 엔드포인트 (인증 없음)"""
    db = get_db(request)
    
    notification_doc = {
        "recipient_id": payload.recipient_id,
        "actor_id": payload.actor_id,
        "actor_username": payload.actor_username,
        "actor_display_name": payload.actor_display_name,
        "type": payload.type,
        "post_id": payload.post_id,
        "comment_id": payload.comment_id,
        "message": payload.message,
        "is_read": False,
        "created_at": datetime.now(timezone.utc),
        "updated_at": None,
    }
    
    result = await db.notifications.insert_one(notification_doc)
    notification_doc["_id"] = result.inserted_id
    
    return build_notification_response(notification_doc)
