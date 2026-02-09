import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

async def delete_test_users():
    # 삭제할 테스트 유저 목록
    test_usernames = [
        "fish", "fox", "fox2", "dog2", "dog", 
        "cat", "test", "테스트유저", "duck"
    ]
    
    # MongoDB 연결
    mongodb_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    client = AsyncIOMotorClient(mongodb_url)
    db = client.sns_db
    
    print(f"🔍 테스트 계정 삭제 시작...")
    print(f"📋 삭제 대상: {', '.join(test_usernames)}\n")
    
    # 1. 삭제할 유저들의 ID 찾기
    users = await db.users.find({"username": {"$in": test_usernames}}).to_list(None)
    user_ids = [str(user["_id"]) for user in users]
    
    if not users:
        print("❌ 삭제할 테스트 계정을 찾을 수 없습니다.")
        client.close()
        return
    
    print(f"✅ {len(users)}개의 테스트 계정을 찾았습니다:")
    for user in users:
        print(f"  - {user.get('username')} (닉네임: {user.get('nickname', 'N/A')})")
    
    # 2. 해당 유저들의 게시글 삭제
    posts_result = await db.posts.delete_many({"user_id": {"$in": user_ids}})
    print(f"\n📝 {posts_result.deleted_count}개의 게시글 삭제")
    
    # 3. 해당 유저들의 댓글 삭제
    comments_result = await db.comments.delete_many({"user_id": {"$in": user_ids}})
    print(f"💬 {comments_result.deleted_count}개의 댓글 삭제")
    
    # 4. 해당 유저들과 관련된 알림 삭제 (받은 알림 + 보낸 알림)
    notifications_result = await db.notifications.delete_many({
        "$or": [
            {"user_id": {"$in": user_ids}},
            {"from_user_id": {"$in": user_ids}}
        ]
    })
    print(f"🔔 {notifications_result.deleted_count}개의 알림 삭제")
    
    # 5. 해당 유저들의 방명록 삭제 (받은 방명록 + 작성한 방명록)
    guestbook_result = await db.guestbook.delete_many({
        "$or": [
            {"profile_user_id": {"$in": user_ids}},
            {"writer_id": {"$in": user_ids}}
        ]
    })
    print(f"📖 {guestbook_result.deleted_count}개의 방명록 삭제")
    
    # 6. 마지막으로 유저 계정 삭제
    users_result = await db.users.delete_many({"username": {"$in": test_usernames}})
    print(f"👤 {users_result.deleted_count}개의 유저 계정 삭제")
    
    print(f"\n✅ 테스트 계정 삭제 완료!")
    print(f"총 {len(users)}개의 테스트 계정과 관련 데이터가 모두 삭제되었습니다.")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(delete_test_users())
