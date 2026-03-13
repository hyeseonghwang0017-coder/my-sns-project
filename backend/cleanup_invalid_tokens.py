#!/usr/bin/env python3
"""
무효한 디바이스 토큰 정리 스크립트
- None 또는 빈 문자열 토큰 제거
- 매우 짧거나 형식이 잘못된 토큰 제거
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
MONGODB_DB = os.getenv("MONGODB_DB", "sns_db")

async def cleanup_invalid_tokens():
    """
    무효한 토큰 정리:
    1. None인 토큰
    2. 빈 문자열 토큰
    3. 형식이 잘못된 토큰 (너무 짧음, 특수문자 포함 등)
    """
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[MONGODB_DB]
    
    try:
        # 1. None인 토큰 통계
        none_count = await db.users.count_documents({"device_token": None})
        print(f"🔍 None 토큰 사용자: {none_count}명")
        
        # 2. 빈 문자열 토큰 찾기 및 제거
        empty_result = await db.users.update_many(
            {"device_token": ""},
            {"$set": {"device_token": None}}
        )
        print(f"✅ 빈 문자열 토큰 정리: {empty_result.modified_count}개 → None으로 변경")
        
        # 3. 형식이 잘못된 토큰 찾기 (FCM 토큰은 일반적으로 100자 이상, 알파벳+숫자+특수문자)
        all_users = await db.users.find({"device_token": {"$ne": None}}).to_list(None)
        invalid_tokens = []
        
        for user in all_users:
            token = user.get("device_token")
            if token:
                # FCM 토큰 형식 검증
                # 일반적으로 FCM 토큰은:
                # - 100-1000자 사이
                # - 대소문자, 숫자, 특수문자(-_:) 포함
                # - 공백 없음
                is_valid = (
                    isinstance(token, str) and
                    60 < len(token) < 1000 and
                    not ' ' in token and
                    (any(c.isalpha() for c in token) or any(c.isdigit() for c in token))
                )
                if not is_valid:
                    invalid_tokens.append({
                        "user_id": user["_id"],
                        "email": user.get("email"),
                        "token": token[:50] + "..." if len(token) > 50 else token
                    })
        
        if invalid_tokens:
            print(f"\n⚠️  형식이 잘못된 토큰 발견: {len(invalid_tokens)}개")
            for item in invalid_tokens[:10]:  # 처음 10개만 표시
                print(f"  - {item['email']}: {item['token']}")
            
            # 형식이 잘못된 토큰 제거
            if len(invalid_tokens) > 0:
                user_ids = [item["user_id"] for item in invalid_tokens]
                result = await db.users.update_many(
                    {"_id": {"$in": user_ids}},
                    {"$set": {"device_token": None}}
                )
                print(f"✅ {result.modified_count}개의 잘못된 토큰 제거됨")
        else:
            print(f"\n✅ 형식이 잘못된 토큰: 없음")
        
        # 최종 통계
        print("\n📊 최종 통계:")
        total_users = await db.users.count_documents({})
        users_with_token = await db.users.count_documents({"device_token": {"$ne": None}})
        users_without_token = total_users - users_with_token
        
        print(f"  - 전체 사용자: {total_users}명")
        print(f"  - 유효한 토큰 보유: {users_with_token}명")
        print(f"  - 토큰 없음: {users_without_token}명")
        print(f"  - 토큰 보유율: {users_with_token/total_users*100:.1f}%")
        
    finally:
        client.close()

async def show_invalid_tokens():
    """현재 유효하지 않은 토큰 목록 표시"""
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[MONGODB_DB]
    
    try:
        all_users = await db.users.find({"device_token": {"$ne": None}}).to_list(None)
        
        print("\n🔍 현재 저장된 토큰 샘플 (처음 10개):")
        for i, user in enumerate(all_users[:10]):
            token = user.get("device_token", "")
            print(f"  {i+1}. {user.get('email')}")
            print(f"     - 길이: {len(token)}")
            print(f"     - 미리보기: {token[:50]}...")
            print()
    
    finally:
        client.close()

if __name__ == "__main__":
    print("=" * 60)
    print("디바이스 토큰 정리 도구")
    print("=" * 60)
    
    asyncio.run(cleanup_invalid_tokens())
