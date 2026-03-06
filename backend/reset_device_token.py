import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import os
from dotenv import load_dotenv

load_dotenv("/Users/hyeseong/Desktop/my-sns-project/backend/.env")

async def reset_device_token():
    mongodb_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    client = AsyncIOMotorClient(mongodb_url)
    db = client.sns_db
    
    result = await db.users.update_one(
        {"email": "goose@test.com"},
        {"$set": {"device_token": None}}
    )
    
    if result.matched_count > 0:
        print(f"✅ goose@test.com의 device_token이 초기화되었습니다.")
    else:
        print("❌ 유저를 찾을 수 없습니다.")
    
    client.close()

asyncio.run(reset_device_token())
