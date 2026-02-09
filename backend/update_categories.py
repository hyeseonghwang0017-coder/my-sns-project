import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

async def update_all_posts_to_daily():
    # MongoDB 연결
    mongodb_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    client = AsyncIOMotorClient(mongodb_url)
    db = client.sns_db
    
    # 모든 게시글을 "일상"으로 업데이트 (강제 업데이트)
    result = await db.posts.update_many(
        {},  # 모든 게시글
        {"$set": {"category": "일상"}}
    )
    
    print(f"✅ 업데이트 완료!")
    print(f"📊 총 {result.matched_count}개의 게시글을 찾았습니다.")
    print(f"✏️ {result.matched_count}개의 게시글을 '일상' 카테고리로 업데이트했습니다.")
    
    # 확인을 위해 몇 개의 게시글 카테고리 출력
    posts = await db.posts.find({}).limit(5).to_list(5)
    print("\n📝 확인: 최근 5개 게시글의 카테고리")
    for post in posts:
        print(f"  - {post.get('content', '')[:30]}... → 카테고리: {post.get('category', 'N/A')}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(update_all_posts_to_daily())
