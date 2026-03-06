import firebase_admin
from firebase_admin import credentials
import os
import json

try:
    # firebase-credentials.json 파일 로드 및 검증
    with open("firebase-credentials.json", "r") as f:
        cred_dict = json.load(f)
    print("✅ firebase-credentials.json 파일이 유효한 JSON입니다.")
    print("프로젝트 ID:", cred_dict.get("project_id"))
    
    # Firebase 초기화 시도
    cred = credentials.Certificate("firebase-credentials.json")
    if not firebase_admin._apps:
        firebase_admin.initialize_app(cred)
    print("✅ Firebase 초기화 성공!")
    
except json.JSONDecodeError as e:
    print(f"❌ JSON 파싱 오류: {e}")
except FileNotFoundError:
    print("❌ firebase-credentials.json 파일을 찾을 수 없습니다.")
except Exception as e:
    print(f"❌ Firebase 초기화 오류: {e}")
