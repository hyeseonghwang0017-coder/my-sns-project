# GGame SNS 📱

한국식 소셜 네트워크 플랫폼 - GGame

## 🚀 주요 기능

- 게시글 작성, 수정, 삭제
- 무한 스크롤 피드 (트위터 스타일)
- 댓글 및 대댓글 시스템
- 좋아요 기능
- 사용자 프로필 및 프로필 사진
- 사용자 방명록
- 실시간 알림 시스템 (4가지 트리거)
- 프로필 이미지 아바타 버블

## 🛠️ 기술 스택

### 백엔드
- **Framework**: FastAPI (Python)
- **Database**: MongoDB Atlas
- **Authentication**: JWT
- **Image Storage**: Cloudinary
- **Server**: Uvicorn

### 프론트엔드
- **Framework**: React 19
- **Router**: React Router 7
- **HTTP Client**: Axios
- **Styling**: Inline CSS

## 📦 설치 및 실행

### 개발 환경

#### 백엔드
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

#### 프론트엔드
```bash
cd frontend
npm install
npm start
```

### 환경 변수 설정

프로젝트 루트에 `.env` 파일을 생성하세요:

```
MONGO_URI=your_mongodb_connection_string
SECRET_KEY=your_secret_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## 🌐 배포

### Vercel (프론트엔드)
1. Vercel 계정 생성 (vercel.com)
2. GitHub 저장소 연동
3. `/frontend` 폴더를 Root Directory로 설정
4. 환경 변수 설정:
   - `REACT_APP_API_URL`: Render 백엔드 URL

### Render (백엔드)
1. Render 계정 생성 (render.com)
2. GitHub 저장소 연동
3. "New Web Service" 생성
4. 다음 설정:
   - **Name**: ggame-backend
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
   - **Root Directory**: (비워두기)
5. 환경 변수 추가:
   - MONGO_URI
   - SECRET_KEY
   - CLOUDINARY_CLOUD_NAME
   - CLOUDINARY_API_KEY
   - CLOUDINARY_API_SECRET

## 📝 프로젝트 구조

```
my-sns-project/
├── backend/
│   ├── models/          # 데이터 모델
│   ├── routes/          # API 라우트
│   ├── utils/           # 유틸리티 (인증 등)
│   └── main.py          # FastAPI 메인 파일
├── frontend/
│   ├── src/
│   │   ├── pages/       # 페이지 컴포넌트
│   │   ├── components/  # 재사용 컴포넌트
│   │   ├── services/    # API 서비스
│   │   └── App.js       # 메인 App
│   └── package.json
├── requirements.txt     # Python 의존성
├── .env.example        # 환경 변수 예시
└── render.yaml         # Render 설정
```

## 🔑 주요 API 엔드포인트

### 인증
- `POST /api/users/register` - 회원가입
- `POST /api/users/login` - 로그인
- `GET /api/users/me` - 현재 사용자 정보

### 게시글
- `GET /api/posts` - 게시글 목록
- `POST /api/posts` - 게시글 작성
- `PUT /api/posts/{id}` - 게시글 수정
- `DELETE /api/posts/{id}` - 게시글 삭제
- `POST /api/posts/{id}/like` - 좋아요

### 댓글
- `GET /api/posts/{id}/comments` - 댓글 목록
- `POST /api/posts/{id}/comments` - 댓글 작성
- `PUT /api/posts/{id}/comments/{id}` - 댓글 수정
- `DELETE /api/posts/{id}/comments/{id}` - 댓글 삭제

### 프로필
- `GET /api/profiles/{user_id}` - 사용자 프로필
- `GET /api/profiles/{user_id}/posts` - 사용자 게시글
- `GET /api/profiles/{user_id}/guestbook` - 방명록

### 알림
- `GET /api/notifications` - 알림 목록
- `POST /api/notifications/{id}/read` - 알림 읽음
- `DELETE /api/notifications/{id}` - 알림 삭제

## 👨‍💻 개발자

혜성

## 📄 라이선스

MIT
