# 푸시 알림 NotRegistered 에러 개선사항 요약

## 문제
- Firebase FCM에서 "NotRegistered" 에러 발생
- 무효한 토큰이 데이터베이스에 남아있음
- 무효 토큰 자동 제거 메커니즘 없음

## 해결방안

### 1️⃣ 백엔드 코어 개선 (`utils/push_notification.py`)

#### 에러 분류 시스템
```python
class PushNotificationError:
    INVALID_TOKEN = "InvalidToken"
    NOT_REGISTERED = "NotRegistered"
    MESSAGE_RATE_EXCEEDED = "MessageRateExceeded"
    THIRD_PARTY_AUTH_ERROR = "ThirdPartyAuthError"
    INTERNAL_ERROR = "InternalError"
    UNKNOWN = "Unknown"
```

#### 자동 토큰 제거 콜백
```python
def send_push_notification(
    device_tokens, 
    title, 
    body,
    on_invalid_token: Optional[Callable[[str], None]] = None  # 👈 새로 추가
):
```

- NotRegistered/InvalidToken 감지 시 자동으로 콜백 실행
- 데이터베이스에서 토큰 즉시 제거 가능
- 상세한 에러 분류 및 로깅

### 2️⃣ API 엔드포인트 개선

#### `routes/posts.py`
```python
# 좋아요/댓글 푸시 알림 발송 시
async def handle_invalid_token(token: str):
    await remove_invalid_token(author["_id"], db)

result = send_push_notification(
    [author["device_token"]],
    "제목",
    "본문",
    on_invalid_token=handle_invalid_token  # 👈 콜백 전달
)
```

#### `routes/profiles.py`
- 방명록 알림에도 동일한 개선사항 적용

### 3️⃣ 유틸리티 스크립트 (3개 추가)

#### `cleanup_invalid_tokens.py`
- 형식이 잘못된 토큰 정리
- None/빈 문자열 통합

```bash
python cleanup_invalid_tokens.py
```

#### `diagnose_push_notifications.py`
- Firebase 연결 상태 확인
- 특정 사용자 토큰 상태 조회
- 테스트 푸시 알림 발송

```bash
python diagnose_push_notifications.py
```

#### `batch_validate_tokens.py`
- 모든 사용자의 토큰을 배치 검증
- 드라이런 모드 & 실행 모드

```bash
# 드라이런
python batch_validate_tokens.py

# 실제 실행
python batch_validate_tokens.py --remove
```

### 4️⃣ 문서 작성

#### `PUSH_NOTIFICATION_FIX_GUIDE.md`
- 상세한 사용 가이드
- 문제 해결 방법
- 성능 최적화 팁

## 📊 개선 효과

### Before
- ❌ NotRegistered 에러 지속 발생
- ❌ 무효 토큰 데이터베이스에 축적
- ❌ 수동으로만 정리 가능
- ❌ 에러 분류 불가

### After
- ✅ NotRegistered 에러 자동 감지 & 제거
- ✅ 무효 토큰 즉시 정리
- ✅ 자동화된 배치 정리 도구 제공
- ✅ 상세한 에러 분류 및 모니터링
- ✅ 진단 도구로 즉각적 파악 가능

## 🚀 배포 순서

1. **코드 배포**
   ```bash
   git add .
   git commit -m "feat: 푸시 알림 NotRegistered 에러 처리 개선"
   git push origin main
   ```

2. **초기 데이터 정리** (배포 후)
   ```bash
   python cleanup_invalid_tokens.py
   python batch_validate_tokens.py  # 드라이런
   python batch_validate_tokens.py --remove  # 실행
   ```

3. **테스트**
   ```bash
   python diagnose_push_notifications.py
   ```

## 📈 모니터링 포인트

- 로그에서 `[NotRegistered]` 토큰 감소 추적
- 토큰 보유율 모니터링 (50% 이상 권장)
- 에러 분류별 통계 수집

## ⚙️ 기술 상세

### 왜 콜백을 사용하나?
- 비동기 처리로 성능 영향 최소화
- 푸시 알림 발송 로직과 토큰 관리 분리
- 유연한 에러 처리 가능

### NotRegistered가 발생하는 이유
1. 앱이 기기에서 제거됨
2. 토큰이 만료됨 (30일 미사용)
3. 사용자가 알림 권한 거부
4. Firebase 프로젝트 변경

### 자동 제거의 한계
- NotRegistered/InvalidToken만 자동 처리
- 다른 에러는 콜백 전달 안 됨
- 실패한 발송은 즉시 재시도 안 함

## 📝 파일 변경 목록

| 파일 | 변경 내용 |
|------|---------|
| `utils/push_notification.py` | 에러 분류, 콜백 시스템 추가 |
| `routes/posts.py` | 자동 토큰 제거 콜백 추가 |
| `routes/profiles.py` | 자동 토큰 제거 콜백 추가 |
| `cleanup_invalid_tokens.py` | 새 파일 추가 |
| `diagnose_push_notifications.py` | 새 파일 추가 |
| `batch_validate_tokens.py` | 새 파일 추가 |
| `PUSH_NOTIFICATION_FIX_GUIDE.md` | 새 파일 추가 |

## ✅ 다음 단계

- [ ] 코드 리뷰
- [ ] 테스트 환경에서 검증
- [ ] 프로덕션 배포
- [ ] 초기 데이터 정리 실행
- [ ] 모니터링 시작
