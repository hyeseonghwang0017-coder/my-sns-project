#!/usr/bin/env python3
"""
푸시 알림 진단 및 테스트 스크립트
- 특정 사용자의 토큰 상태 확인
- 테스트 푸시 알림 발송 및 결과 분석
- Firebase 연결 상태 확인
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from utils.push_notification import send_push_notification
import json
import tempfile
import firebase_admin
from firebase_admin import credentials, messaging

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
MONGODB_DB = os.getenv("MONGODB_DB", "sns_db")

async def check_firebase_connection():
    """Firebase 연결 상태 확인"""
    print("\n🔐 Firebase 연결 상태 확인")
    print("-" * 50)
    
    firebase_cred_json = os.getenv("FIREBASE_CREDENTIALS")
    
    try:
        if firebase_cred_json:
            cred_dict = json.loads(firebase_cred_json)
            project_id = cred_dict.get("project_id")
            print(f"✅ Firebase 환경변수에서 자격증명 로드됨")
            print(f"   Project ID: {project_id}")
            return True
        elif os.path.exists("firebase-credentials.json"):
            with open("firebase-credentials.json") as f:
                cred_dict = json.load(f)
            project_id = cred_dict.get("project_id")
            print(f"✅ 로컬 firebase-credentials.json 파일 사용")
            print(f"   Project ID: {project_id}")
            return True
        else:
            print(f"❌ Firebase 자격증명을 찾을 수 없습니다")
            return False
    except Exception as e:
        print(f"❌ Firebase 자격증명 검증 실패: {e}")
        return False

async def check_user_token(email: str):
    """특정 사용자의 토큰 상태 확인"""
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[MONGODB_DB]
    
    try:
        user = await db.users.find_one({"email": email})
        
        if not user:
            print(f"\n❌ 사용자를 찾을 수 없습니다: {email}")
            return None
        
        print(f"\n👤 사용자 정보")
        print("-" * 50)
        print(f"  이메일: {user.get('email')}")
        print(f"  사용자명: {user.get('username')}")
        print(f"  표시명: {user.get('display_name')}")
        
        token = user.get("device_token")
        if token:
            print(f"\n📱 토큰 정보")
            print(f"  - 상태: ✅ 저장됨")
            print(f"  - 길이: {len(token)}")
            print(f"  - 미리보기: {token[:50]}...")
            return token
        else:
            print(f"\n📱 토큰 정보")
            print(f"  - 상태: ❌ 없음")
            return None
    
    finally:
        client.close()

async def test_push_notification(email: str):
    """테스트 푸시 알림 발송"""
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[MONGODB_DB]
    
    try:
        user = await db.users.find_one({"email": email})
        
        if not user:
            print(f"\n❌ 사용자를 찾을 수 없습니다: {email}")
            return
        
        token = user.get("device_token")
        if not token:
            print(f"\n❌ 사용자가 등록된 토큰이 없습니다")
            return
        
        print(f"\n📤 테스트 푸시 알림 발송")
        print("-" * 50)
        
        # invalid 토큰 감지 시 처리
        async def handle_invalid_token(invalid_token: str):
            print(f"\n🔴 무효한 토큰 감지됨 - 자동 제거")
            await db.users.update_one(
                {"_id": user["_id"]},
                {"$set": {"device_token": None}}
            )
        
        result = send_push_notification(
            token,
            "테스트 알림 🧪",
            f"안녕하세요, {user.get('display_name')}님! 이것은 테스트 푸시 알림입니다.",
            on_invalid_token=handle_invalid_token
        )
        
        if result:
            print(f"\n✅ 발송 결과:")
            print(f"  - 성공: {result.get('success_count')}")
            print(f"  - 실패: {result.get('failure_count')}")
            
            if result.get('error_details'):
                print(f"\n📊 에러 분류:")
                for error_type, tokens in result['error_details'].items():
                    if tokens:
                        print(f"  - {error_type}: {len(tokens)}개")
        
    finally:
        client.close()

async def show_token_statistics():
    """토큰 통계 표시"""
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[MONGODB_DB]
    
    try:
        print(f"\n📊 토큰 통계")
        print("-" * 50)
        
        total_users = await db.users.count_documents({})
        users_with_token = await db.users.count_documents({"device_token": {"$ne": None}})
        users_without_token = total_users - users_with_token
        
        print(f"  - 전체 사용자: {total_users}명")
        print(f"  - 토큰 보유 사용자: {users_with_token}명")
        print(f"  - 토큰 없는 사용자: {users_without_token}명")
        if total_users > 0:
            print(f"  - 토큰 보유율: {users_with_token/total_users*100:.1f}%")
        
        # 최근 토큰 샘플
        print(f"\n📱 최근 토큰 샘플 (처음 5명):")
        users_with_tokens = await db.users.find(
            {"device_token": {"$ne": None}}
        ).limit(5).to_list(None)
        
        for i, user in enumerate(users_with_tokens, 1):
            token = user.get("device_token", "")
            print(f"  {i}. {user.get('email')} - {token[:40]}...")
    
    finally:
        client.close()

async def main():
    print("=" * 60)
    print("푸시 알림 진단 도구")
    print("=" * 60)
    
    # Firebase 연결 확인
    firebase_ok = await check_firebase_connection()
    
    if not firebase_ok:
        print("\n⚠️  Firebase 연결 설정이 필요합니다.")
        return
    
    # 통계 표시
    await show_token_statistics()
    
    # 대화형 메뉴
    print("\n" + "=" * 60)
    print("옵션:")
    print("-" * 60)
    print("1. 특정 사용자의 토큰 확인")
    print("2. 테스트 푸시 알림 발송")
    print("3. 종료")
    
    choice = input("\n선택하세요 (1-3): ").strip()
    
    if choice == "1":
        email = input("사용자 이메일: ").strip()
        await check_user_token(email)
    
    elif choice == "2":
        email = input("사용자 이메일: ").strip()
        await test_push_notification(email)
    
    elif choice == "3":
        print("종료합니다.")
        return

if __name__ == "__main__":
    asyncio.run(main())
