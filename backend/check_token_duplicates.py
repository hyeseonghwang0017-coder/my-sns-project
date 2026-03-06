import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv("/Users/hyeseong/Desktop/my-sns-project/backend/.env")

async def check_duplicates():
    mongodb_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    client = AsyncIOMotorClient(mongodb_url)
    db = client.sns_db
    user = await db.users.find_one({"email": "goose@test.com"})
    if not user:
        print("❌ 유저를 찾을 수 없습니다.")
    else:
        token = user.get("device_token")
        if isinstance(token, list):
            print(f"❌ device_token이 배열입니다 ({len(token)}개):")
            for i, t in enumerate(token):
                print(f"  {i+1}. {t}")
        else:
            print(f"✅ device_token은 단일 값입니다: {token[:50]}...")
    client.close()

asyncio.run(check_duplicates())
