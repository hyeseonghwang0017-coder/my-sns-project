# 푸시 알림 개선사항 가이드

## 개요
NotRegistered 에러를 해결하기 위한 포괄적인 개선사항들입니다.

## 📋 변경사항

### 1. 백엔드 개선

#### `utils/push_notification.py`
- **에러 분류 시스템 추가**
  - `PushNotificationError` 클래스로 Firebase 에러 분류
  - NotRegistered, InvalidToken, MessageRateExceeded 등 구분
  
- **콜백 함수 지원**
  - `on_invalid_token` 파라미터로 무효 토큰 감지 시 자동 처리
  - 데이터베이스에서 토큰 자동 제거 가능

- **상세 에러 로깅**
  - 에러별 상세 정보 수집
  - 에러 발생 원인 파악 용이

#### `routes/posts.py`, `routes/profiles.py`
- **자동 토큰 제거**
  - NotRegistered/InvalidToken 감지 시 콜백 함수로 자동 제거
  - 기기에서 앱이 제거되거나 토큰이 만료된 경우 처리
  - 사용자가 재설치/재등록 시 새 토큰 자동 저장

### 2. 유틸리티 스크립트

#### `cleanup_invalid_tokens.py`
- 데이터베이스의 형식이 잘못된 토큰 정리
- None/빈 문자열 통합
- 토큰 통계 표시

```bash
cd backend
python cleanup_invalid_tokens.py
```

#### `diagnose_push_notifications.py`
- 푸시 알림 진단 도구
- 특정 사용자 토큰 상태 확인
- 테스트 푸시 알림 발송 및 분석
- Firebase 연결 상태 확인

```bash
cd backend
python diagnose_push_notifications.py
```

#### `batch_validate_tokens.py`
- 모든 사용자의 토큰을 배치로 검증
- 드라이런 모드로 먼저 확인 가능
- 무효 토큰 자동 제거

```bash
# 드라이런 (결과만 표시, 변경 없음)
cd backend
python batch_validate_tokens.py

# 실제 실행 (무효 토큰 제거)
cd backend
python batch_validate_tokens.py --remove
```

## 🎯 사용 흐름

### 1. 초기 진단
```bash
# 현재 상태 확인
python diagnose_push_notifications.py
```

### 2. 전체 데이터베이스 정리
```bash
# 형식이 잘못된 토큰 정리
python cleanup_invalid_tokens.py

# 배치 토큰 검증 (드라이런)
python batch_validate_tokens.py

# 검증 후 실제 제거
python batch_validate_tokens.py --remove
```

### 3. 특정 사용자 테스트
```bash
python diagnose_push_notifications.py
# 메뉴에서 테스트 푸시 알림 발송 선택
```

## 🔧 클라이언트 개선 (권장)

### 1. 토큰 등록 실패 처리
**Frontend/src/utils/capacitorFCM.js**

```javascript
// 토큰 등록 실패 시 재시도
async function registerDeviceToken(fcmToken) {
  const maxRetries = 3;
  let attempt = 0;
  
  while (attempt < maxRetries) {
    try {
      const response = await fetch('/api/users/device-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ device_token: fcmToken })
      });
      
      if (response.ok) {
        console.log('✅ 토큰 등록 성공');
        return true;
      }
    } catch (error) {
      attempt++;
      if (attempt < maxRetries) {
        // 지수 백오프로 재시도
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`⏳ ${delay}ms 후 재시도...`);
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }
  
  console.error('❌ 토큰 등록 실패');
  return false;
}
```

### 2. 주기적 토큰 갱신
```javascript
// 30일마다 토큰 갱신
setInterval(async () => {
  const newToken = await getNewFCMToken();
  await registerDeviceToken(newToken);
}, 30 * 24 * 60 * 60 * 1000);
```

### 3. 온라인/오프라인 상태 관리
```javascript
// 온라인 복귀 시 토큰 재확인
window.addEventListener('online', async () => {
  const fcmToken = await getAndSaveFCMToken();
  console.log('✅ 온라인 복귀: 토큰 갱신됨');
});
```

## 📊 모니터링

### 로그 확인 포인트
- `NotRegistered`: 기기에서 앱이 제거되거나 토큰이 만료됨
- `InvalidToken`: 토큰 형식 오류 (거의 발생 안함)
- `success_count/failure_count`: 발송 성공률

### 정상 작동 신호
- 댓글 작성 시 푸시 알림이 즉시 발송됨
- 에러 분류에 `NotRegistered` 항목이 없음
- 토큰 보유율이 높음 (50% 이상 권장)

## 🆘 문제 해결

### "NotRegistered" 계속 발생
1. `batch_validate_tokens.py --remove` 실행하여 정리
2. 클라이언트에서 앱 재설치 유도
3. 토큰 갱신 로직 확인

### 토큰 보유율이 낮음
1. 클라이언트 FCM 설정 확인
2. 브라우저 알림 권한 확인
3. Firebase 프로젝트 설정 확인

### Firebase 연결 실패
1. `FIREBASE_CREDENTIALS` 환경변수 확인
2. firebase-credentials.json 파일 존재 확인
3. JSON 형식 유효성 확인

## 📈 성능 최적화

### 토큰 캐싱
```python
# 같은 요청 내에서 토큰 중복 조회 방지
user_cache = {}

async def get_user_cached(user_id, db):
    if user_id not in user_cache:
        user_cache[user_id] = await db.users.find_one({"_id": user_id})
    return user_cache[user_id]
```

### 배치 발송
```python
# 여러 사용자에게 동일 메시지 발송 시
send_push_notification(
    [token1, token2, token3],  # 리스트로 전달
    "제목",
    "본문"
)
```

## ✅ 체크리스트

- [ ] 새 코드 배포됨
- [ ] `cleanup_invalid_tokens.py` 실행
- [ ] `batch_validate_tokens.py --remove` 실행
- [ ] 테스트 푸시 알림 발송 확인
- [ ] 클라이언트 FCM 설정 재확인
- [ ] 앱 재설치로 새 토큰 등록 테스트

## 📞 추가 지원

Firebase 문서: https://firebase.google.com/docs/cloud-messaging
에러 코드: https://firebase.google.com/docs/cloud-messaging/fcm-errors
