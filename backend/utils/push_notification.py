import firebase_admin
from firebase_admin import credentials, messaging
import os
import json
import tempfile

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
    elif os.path.exists("firebase-credentials.json"):
        # 로컬 개발용: 파일에서 읽기
        cred = credentials.Certificate("firebase-credentials.json")
        firebase_admin.initialize_app(cred)
        print("✅ Firebase initialized from local file")
    else:
        print("⚠️ Firebase credentials not found. Push notifications will be disabled.")

def send_push_notification(device_tokens, title, body):
    """
    Firebase FCM으로 푸시 알림 전송
    
    Args:
        device_tokens: list of device tokens (사용자들의 디바이스 토큰)
        title: 알림 제목
        body: 알림 내용
    
    Returns:
        dict: 성공/실패 카운트를 포함한 응답
    """
    # Firebase가 초기화되지 않으면 조용히 반환
    if not firebase_admin._apps:
        print("⚠️ Firebase not initialized. Push notification skipped.")
        return {"success_count": 0, "failure_count": 0, "skipped": True}
    
    if not device_tokens:
        print("No device tokens provided")
        return None
    
    # device_tokens가 문자열이면 리스트로 변환
    if isinstance(device_tokens, str):
        device_tokens = [device_tokens]
    
    try:
        # 각 토큰에 개별적으로 메시지 전송
        success_count = 0
        failure_count = 0
        
        for token in device_tokens:
            try:
                message = messaging.Message(
                    notification=messaging.Notification(
                        title=title,
                        body=body,
                    ),
                    token=token,
                )
                response = messaging.send(message)
                print(f'✅ 메시지 전송 성공 (토큰: {token[:20]}...): {response}')
                success_count += 1
            except Exception as token_error:
                print(f'❌ 메시지 전송 실패 (토큰: {token[:20]}...): {token_error}')
                failure_count += 1
        
        print(f'\n총 {success_count}개 성공, {failure_count}개 실패')
        return {"success_count": success_count, "failure_count": failure_count}
    except Exception as e:
        import traceback
        print(f'Error sending message: {e}')
        print(f'오류 세부사항:')
        traceback.print_exc()
        return None