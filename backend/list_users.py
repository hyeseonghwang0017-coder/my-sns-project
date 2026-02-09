import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

async def list_all_users():
    # MongoDB 연결
    mongodb_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    client = AsyncIOMotorClient(mongodb_url)
    db = client.sns_db
    
    print("📋 현재 데이터베이스의 모든 유저 목록:\n")
    
    # 모든 유저 가져오기
    users = await db.users.find({}).to_list(None)
    
    if not users:
        print("❌ 유저가 없습니다.")
    else:
        print(f"총 {len(users)}명의 유저가 있습니다:\n")
        for i, user in enumerate(users, 1):
            print(f"{i}. username: {user.get('username')}")
            print(f"   nickname: {user.get('nickname', 'N/A')}")
            print(f"   email: {user.get('email', 'N/A')}")
            print(f"   _id: {user.get('_id')}")
            print()
    
    client.close()

if __name__ == "__main__":
    asyncio.run(list_all_users())
