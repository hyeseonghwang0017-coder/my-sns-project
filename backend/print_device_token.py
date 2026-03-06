import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

async def print_device_token(user_email):
    mongodb_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    client = AsyncIOMotorClient(mongodb_url)
    db = client.sns_db
    user = await db.users.find_one({"email": user_email})
    if not user:
        print(f"❌ {user_email} 유저를 찾을 수 없습니다.")
    else:
        print(f"{user_email}의 device_token:")
        print(user.get("device_token"))
    client.close()

if __name__ == "__main__":
    import sys
    if len(sys.argv) < 2:
        print("사용법: python print_device_token.py [이메일]")
        exit(1)
    email = sys.argv[1]
    asyncio.run(print_device_token(email))
