#!/usr/bin/env python3
"""
배치 토큰 검증 및 정리 스크립트
- 모든 사용자의 토큰을 테스트하여 유효하지 않은 토큰 식별
- NotRegistered 토큰 자동 제거
- 배치 처리 지원
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from utils.push_notification import send_push_notification, PushNotificationError
import json
import tempfile
import firebase_admin
from firebase_admin import credentials, messaging

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
MONGODB_DB = os.getenv("MONGODB_DB", "sns_db")
BATCH_SIZE = 50  # 한 번에 처리할 토큰 수

async def batch_validate_tokens(dry_run: bool = True):
    """
    배치로 토큰 검증
    - dry_run=True: 결과만 표시
    - dry_run=False: 실제로 무효 토큰 제거
    """
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[MONGODB_DB]
    
    try:
        print("=" * 70)
        print("배치 토큰 검증 스크립트")
        print("=" * 70)
        print(f"모드: {'드라이런 (변경 없음)' if dry_run else '실제 실행 (토큰 제거)'}")
        print()
        
        # 토큰이 있는 사용자 조회
        all_users = await db.users.find(
            {"device_token": {"$ne": None}}
        ).to_list(None)
        
        total_users = len(all_users)
        print(f"📊 검증할 사용자: {total_users}명\n")
        
        invalid_tokens = []
        valid_tokens = []
        
        # 배치 처리
        for batch_num, i in enumerate(range(0, total_users, BATCH_SIZE)):
            batch = all_users[i:i+BATCH_SIZE]
            batch_invalid = []
            
            print(f"🔄 배치 {batch_num + 1} 처리 중... ({i+1}-{min(i+BATCH_SIZE, total_users)}/{total_users})")
            
            for user in batch:
                token = user.get("device_token")
                user_id = user["_id"]
                email = user.get("email", "unknown")
                
                if not token:
                    continue
                
                # 각 토큰에 대해 스토리지 메시지 전송 시도 (실제 발송하지 않음)
                try:
                    message = messaging.Message(
                        data={"test": "validation"},
                        token=token,
                    )
                    # dry_run이면 실제 발송하지 않고 검증만 수행
                    if not dry_run:
                        response = messaging.send(message)
                        valid_tokens.append(email)
                    else:
                        # dry_run 모드에서는 형식 검증만
                        if 60 < len(token) < 1000 and not ' ' in token:
                            valid_tokens.append(email)
                        else:
                            batch_invalid.append({
                                "user_id": user_id,
                                "email": email,
                                "reason": "형식 오류"
                            })
                
                except Exception as e:
                    error_str = str(e).lower()
                    
                    if "notregistered" in error_str:
                        batch_invalid.append({
                            "user_id": user_id,
                            "email": email,
                            "reason": "NotRegistered"
                        })
                    elif "invalid" in error_str:
                        batch_invalid.append({
                            "user_id": user_id,
                            "email": email,
                            "reason": "Invalid Token"
                        })
                    else:
                        batch_invalid.append({
                            "user_id": user_id,
                            "email": email,
                            "reason": str(e)[:50]
                        })
            
            invalid_tokens.extend(batch_invalid)
            
            if batch_invalid:
                print(f"  ⚠️  {len(batch_invalid)}개의 무효 토큰 발견\n")
            else:
                print(f"  ✅ 모든 토큰 유효\n")
        
        # 결과 정리
        print("\n" + "=" * 70)
        print("📊 검증 결과")
        print("=" * 70)
        print(f"✅ 유효한 토큰: {len(valid_tokens)}개")
        print(f"❌ 무효한 토큰: {len(invalid_tokens)}개")
        
        if invalid_tokens:
            print(f"\n📋 무효한 토큰 목록 (처음 20개):")
            for i, item in enumerate(invalid_tokens[:20], 1):
                print(f"  {i:2}. {item['email']:30} - {item['reason']}")
            
            if len(invalid_tokens) > 20:
                print(f"  ... 외 {len(invalid_tokens) - 20}개")
            
            # 실제 실행 모드에서 토큰 제거
            if not dry_run:
                print(f"\n🗑️  무효 토큰 제거 중...")
                user_ids_to_clean = [item["user_id"] for item in invalid_tokens]
                
                result = await db.users.update_many(
                    {"_id": {"$in": user_ids_to_clean}},
                    {"$set": {"device_token": None}}
                )
                
                print(f"✅ {result.modified_count}개 사용자의 토큰 제거됨")
            else:
                print(f"\n💡 드라이런 모드: 실제로 제거되지 않았습니다.")
                print(f"실제 실행하려면 다시 실행해주세요.")
        else:
            print(f"\n✅ 모든 토큰이 유효합니다!")
        
        # 최종 통계
        print(f"\n📈 최종 통계:")
        users_after = await db.users.count_documents({"device_token": {"$ne": None}})
        total_after = await db.users.count_documents({})
        
        print(f"  - 전체 사용자: {total_after}")
        print(f"  - 유효한 토큰: {users_after}")
        print(f"  - 토큰 보유율: {users_after/total_after*100:.1f}%")
    
    finally:
        client.close()

if __name__ == "__main__":
    import sys
    
    # 명령행 인자 처리
    dry_run = True
    if len(sys.argv) > 1 and sys.argv[1] == "--remove":
        response = input("\n⚠️  경고: 이 작업은 무효한 토큰을 실제로 제거합니다.\n계속하시겠습니까? (yes/no): ").lower()
        if response == "yes":
            dry_run = False
        else:
            print("취소되었습니다.")
            sys.exit(0)
    
    asyncio.run(batch_validate_tokens(dry_run=dry_run))
