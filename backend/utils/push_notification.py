# backend/utils/push_notification.py 파일 생성
import requests

SWING2APP_API_URL = "https://swing2app.co.kr/swapi/push/send"
SWING2APP_APP_ID = "YOUR_APP_ID"  # Swing2App에서 받은 앱 ID

def send_push_notification(device_tokens, title, message):
    data = {
        "app_id": SWING2APP_APP_ID,
        "send_target_list": device_tokens,
        "send_type": "push",
        "title": title,
        "message": message,
    }
    
    try:
        response = requests.post(SWING2APP_API_URL, json=data)
        return response.json()
    except Exception as e:
        print(f"Push notification error: {e}")
        return None