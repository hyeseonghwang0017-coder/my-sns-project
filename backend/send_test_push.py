import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from utils.push_notification import send_push_notification
import os
from dotenv import load_dotenv

load_dotenv()

async def send_test_push(user_email, title, body):
    mongodb_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    client = AsyncIOMotorClient(mongodb_url)
    db = client.sns_db
    user = await db.users.find_one({"email": user_email})
    if not user or not user.get("device_token"):
        print("❌ 해당 유저의 디바이스 토큰이 없습니다.")
        return
    token = user["device_token"]
    print(f"테스트 푸시를 {user_email}로 전송합니다...")
    send_push_notification(token, title, body)
    client.close()

if __name__ == "__main__":
    import sys
    if len(sys.argv) < 2:
        print("사용법: python send_test_push.py [이메일] [제목] [내용]")
        exit(1)
    email = sys.argv[1]
    title = sys.argv[2] if len(sys.argv) > 2 else "테스트 알림"
    body = sys.argv[3] if len(sys.argv) > 3 else "이것은 테스트 푸시입니다."
    asyncio.run(send_test_push(email, title, body))
