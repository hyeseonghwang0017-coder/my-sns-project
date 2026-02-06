import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL")
DATABASE_NAME = os.getenv("DATABASE_NAME", "sns_db")

async def cleanup_deleted_comments():
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    
    # is_deleted=true인 댓글 찾기
    deleted_comments = await db.comments.find({"is_deleted": True}).to_list(length=1000)
    
    deleted_count = 0
    for comment in deleted_comments:
        comment_id = str(comment["_id"])
        # 자식 댓글이 있는지 확인
        child_count = await db.comments.count_documents({"parent_id": comment_id})
        
        if child_count == 0:
            # 자식이 없으면 삭제
            await db.comments.delete_one({"_id": comment["_id"]})
            deleted_count += 1
            print(f"삭제됨: {comment_id}")
    
    print(f"\n총 {deleted_count}개의 댓글이 삭제되었습니다.")
    client.close()

if __name__ == "__main__":
    asyncio.run(cleanup_deleted_comments())
