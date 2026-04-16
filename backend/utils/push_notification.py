import firebase_admin
from firebase_admin import credentials, messaging
import os
import json
import tempfile
from typing import Callable, Optional, List
import asyncio
import inspect

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LOCAL_CREDENTIAL_PATHS = [
    os.path.join(BASE_DIR, "firebase-credentials.json"),
    os.path.join(os.getcwd(), "firebase-credentials.json"),
]

# Firebase 초기화 (한 번만 실행)
if not firebase_admin._apps:
    firebase_cred_json = os.getenv("FIREBASE_CREDENTIALS")
    
    if firebase_cred_json:
        # 환경변수에서 읽은 JSON 문자열을 임시 파일에 저장
        try:
            cred_dict = json.loads(firebase_cred_json)
            with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
                json.dump(cred_dict, f)
                temp_cred_path = f.name
            cred = credentials.Certificate(temp_cred_path)
            firebase_admin.initialize_app(cred)
            print("✅ Firebase initialized from environment variable")
        except Exception as e:
            print(f"❌ Firebase initialization failed: {e}")
    else:
        local_cred_path = next((path for path in LOCAL_CREDENTIAL_PATHS if os.path.exists(path)), None)
        if local_cred_path:
            cred = credentials.Certificate(local_cred_path)
            firebase_admin.initialize_app(cred)
            print(f"✅ Firebase initialized from local file: {local_cred_path}")
        else:
            print("⚠️ Firebase credentials not found. Set FIREBASE_CREDENTIALS or provide backend/firebase-credentials.json. Push notifications will be disabled.")

# 에러 타입 정의
class PushNotificationError:
    """푸시 알림 에러 분류"""
    INVALID_TOKEN = "InvalidToken"           # 토큰 형식 오류
    NOT_REGISTERED = "NotRegistered"         # 토큰이 등록되지 않음 (기기 미설치/제거)
    MESSAGE_RATE_EXCEEDED = "MessageRateExceeded"  # 전송 속도 초과
    THIRD_PARTY_AUTH_ERROR = "ThirdPartyAuthError"  # Firebase 인증 오류
    INTERNAL_ERROR = "InternalError"         # Firebase 내부 오류
    UNKNOWN = "Unknown"                      # 미분류 오류


def classify_error(error_message: str) -> str:
    """Firebase 에러 메시지를 분류"""
    error_str = str(error_message).lower()
    
    if "notregistered" in error_str:
        return PushNotificationError.NOT_REGISTERED
    elif "invalid" in error_str and "token" in error_str:
        return PushNotificationError.INVALID_TOKEN
    elif "messagerate" in error_str:
        return PushNotificationError.MESSAGE_RATE_EXCEEDED
    elif "thirdparty" in error_str:
        return PushNotificationError.THIRD_PARTY_AUTH_ERROR
    elif "internal" in error_str:
        return PushNotificationError.INTERNAL_ERROR
    else:
        return PushNotificationError.UNKNOWN


async def send_push_notification(
    device_tokens, 
    title, 
    body,
    on_invalid_token: Optional[Callable[[str], None]] = None
):
    """
    Firebase FCM으로 푸시 알림 전송 (async)
    
    Args:
        device_tokens: list of device tokens (사용자들의 디바이스 토큰)
        title: 알림 제목
        body: 알림 내용
        on_invalid_token: 무효한 토큰 발견 시 호출될 콜백 함수 (동기 또는 비동기, 토큰 문자열을 인자로 받음)
    
    Returns:
        dict: 성공/실패 카운트와 에러 상세정보를 포함한 응답
    """
    if not firebase_admin._apps:
        print("⚠️ Firebase not initialized. Push notification skipped.")
        return {"success_count": 0, "failure_count": 0, "skipped": True}
    
    if not device_tokens:
        print("No device tokens provided")
        return None
    
    if isinstance(device_tokens, str):
        device_tokens = [device_tokens]
    
    try:
        success_count = 0
        failure_count = 0
        error_details = {
            PushNotificationError.NOT_REGISTERED: [],
            PushNotificationError.INVALID_TOKEN: [],
            PushNotificationError.MESSAGE_RATE_EXCEEDED: [],
            PushNotificationError.THIRD_PARTY_AUTH_ERROR: [],
            PushNotificationError.INTERNAL_ERROR: [],
            PushNotificationError.UNKNOWN: [],
        }
        
        for token in device_tokens:
            try:
                message = messaging.Message(
                    notification=messaging.Notification(
                        title=title,
                        body=body,
                    ),
                    webpush=messaging.WebpushConfig(
                        notification=messaging.WebpushNotification(
                            title=title,
                            body=body,
                        ),
                        fcm_options=messaging.WebpushFCMOptions(
                            link="/",
                        ),
                    ),
                    token=token,
                )
                response = await asyncio.to_thread(messaging.send, message)
                print(f'✅ 메시지 전송 성공 (토큰: {token[:20]}...): {response}')
                success_count += 1
            except Exception as token_error:
                error_str = str(token_error)
                error_type = classify_error(error_str)
                error_details[error_type].append(token)
                
                if error_type in [PushNotificationError.NOT_REGISTERED, PushNotificationError.INVALID_TOKEN]:
                    if on_invalid_token:
                        try:
                            if inspect.iscoroutinefunction(on_invalid_token):
                                await on_invalid_token(token)
                            else:
                                on_invalid_token(token)
                        except Exception as callback_error:
                            print(f"  ⚠️ 토큰 제거 콜백 실행 실패: {callback_error}")
                
                print(f'❌ 메시지 전송 실패 [{error_type}] (토큰: {token[:20]}...): {token_error}')
                failure_count += 1
        
        print(f'\n총 {success_count}개 성공, {failure_count}개 실패')
        
        if failure_count > 0:
            print("\n📊 에러 분류:")
            for error_type, tokens in error_details.items():
                if tokens:
                    print(f"  - {error_type}: {len(tokens)}개")
        
        return {
            "success_count": success_count, 
            "failure_count": failure_count,
            "error_details": error_details
        }
    except Exception as e:
        import traceback
        print(f'Error sending message: {e}')
        print(f'오류 세부사항:')
        traceback.print_exc()
        return None
