# 📚 Vercel + Render 배포 가이드

## 📋 사전 준비

1. **GitHub 계정** (없으면 생성)
2. **Vercel 계정** (vercel.com - GitHub으로 가입)
3. **Render 계정** (render.com - GitHub으로 가입)

---

## ✅ Step 1: GitHub에 프로젝트 Push

### 1.1 Git 저장소 초기화 (처음이면)
```bash
cd /Users/hyeseong/Desktop/my-sns-project
git init
git add .
git commit -m "Initial commit: GGame SNS Platform"
```

### 1.2 GitHub에 저장소 생성
- GitHub.com 로그인
- "New repository" 클릭
- 저장소명: `my-sns-project` (또는 원하는 이름)
- Private 또는 Public 선택 (공개 권장)
- Create repository

### 1.3 로컬 저장소를 GitHub에 연결
```bash
git remote add origin https://github.com/YOUR_USERNAME/my-sns-project.git
git branch -M main
git push -u origin main
```

---

## 🌐 Step 2: Vercel에 프론트엔드 배포

### 2.1 Vercel 계정 연동
1. [vercel.com](https://vercel.com) 방문
2. "Sign Up" → "GitHub으로 가입"
3. GitHub 인증 완료

### 2.2 새 프로젝트 생성
1. Vercel 대시보드 → "New Project"
2. "Import Git Repository" 선택
3. 방금 생성한 `my-sns-project` 저장소 선택
4. Import

### 2.3 프로젝트 설정
- **Project Name**: `ggame-frontend` (또는 원하는 이름)
- **Framework**: `Create React App`
- **Root Directory**: `./frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `build`

### 2.4 환경 변수 설정
**Settings** → **Environment Variables**에서 다음 추가:

```
REACT_APP_API_URL = https://your-backend-url.onrender.com
```

(Render 배포 후 URL이 생기면 여기에 입력)

### 2.5 배포
- "Deploy" 클릭
- 배포 완료 후 Vercel 도메인 확인 (예: `ggame-frontend.vercel.app`)

---

## 🚀 Step 3: Render에 백엔드 배포

### 3.1 Render 계정 연동
1. [render.com](https://render.com) 방문
2. "Sign up" → "GitHub으로 가입"
3. GitHub 인증 완료

### 3.2 새 Web Service 생성
1. Render 대시보드 → "New" → "Web Service"
2. "Connect a repository" 선택
3. `my-sns-project` 저장소 선택
4. Connect

### 3.3 배포 설정
다음과 같이 입력:

| 항목 | 값 |
|------|-----|
| **Name** | `ggame-backend` |
| **Region** | `Singapore` (또는 가까운 지역) |
| **Branch** | `main` |
| **Runtime** | `Python 3` |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `uvicorn backend.main:app --host 0.0.0.0 --port $PORT` |
| **Root Directory** | (비워두기) |

### 3.4 환경 변수 설정
**Environment** 섹션에서 다음 추가:

```
MONGO_URI = your_mongodb_connection_string
SECRET_KEY = your_secret_key
CLOUDINARY_CLOUD_NAME = your_cloud_name
CLOUDINARY_API_KEY = your_api_key
CLOUDINARY_API_SECRET = your_api_secret
```

### 3.5 배포
- "Create Web Service" 클릭
- 배포 진행 중... (3-5분 소요)
- 배포 완료 후 Render 도메인 확인 (예: `ggame-backend.onrender.com`)

---

## 🔄 Step 4: Vercel 환경 변수 업데이트

### Render 배포 완료 후:
1. Vercel 대시보드로 이동
2. 프로젝트 선택 → **Settings** → **Environment Variables**
3. `REACT_APP_API_URL` 값을 Render URL로 업데이트:
   ```
   https://ggame-backend.onrender.com
   ```
4. 저장 후 자동 재배포됨

---

## 🔗 배포 완료!

### 사용자가 접속할 수 있는 URL:
```
https://your-frontend-url.vercel.app
```

### 백엔드 API:
```
https://ggame-backend.onrender.com
```

---

## ⚠️ 주의사항

### Render 무료 Tier 특징:
- ✅ 무료로 사용 가능
- ⚠️ 15분 동안 요청이 없으면 자동 슬립 (콜드 스타트)
- 💡 유저가 다시 방문하면 자동으로 깨어남 (5-30초 대기)

### MongoDB Atlas 접속 제한:
1. MongoDB Atlas 대시보드 로그인
2. **Network Access** → **Add IP Address**
3. `0.0.0.0/0` 입력 (모든 IP에서 접속 허용)
4. Confirm

### Cloudinary 설정 확인:
- Cloudinary 대시보드에서 API Key 확인
- Render의 환경 변수와 일치하는지 확인

---

## 📱 로컬에서 테스트

프론트엔드 환경 변수를 배포된 백엔드로 테스트:

```bash
cd frontend
REACT_APP_API_URL=https://ggame-backend.onrender.com npm start
```

---

## 🐛 배포 후 문제 해결

### "Connection refused" 에러
- MongoDB Atlas IP 화이트리스트 확인
- Render 환경 변수 확인

### "CORS" 에러
- 백엔드에서 `allow_origins=["*"]` 확인
- 프론트엔드 API URL이 정확한지 확인

### 프론트엔드 빌드 실패
- `npm run build` 로컬에서 먼저 테스트
- Node.js 버전 확인 (v16 이상 권장)

### 백엔드 배포 실패
- `requirements.txt` 파일 존재 확인
- 로컬에서 `pip install -r requirements.txt` 테스트

---

## 📊 모니터링

### Vercel
- 대시보드에서 배포 상태 확인
- Logs 탭에서 에러 확인

### Render
- 대시보드에서 서비스 상태 확인
- Logs 탭에서 서버 로그 확인

---

**축하합니다! 🎉 GGame SNS가 전 세계에 배포되었습니다!**
