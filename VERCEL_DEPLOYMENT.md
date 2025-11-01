# Vercel 배포 가이드

## 🚀 배포 단계

### 1. 의존성 설치
```bash
npm install
```

### 2. 로컬에서 빌드 테스트
```bash
npm run vercel-build
```

### 3. Vercel CLI 설치 (선택사항)
```bash
npm install -g vercel
```

### 4. Vercel에 배포

#### 방법 1: GitHub 연동 (추천)
1. GitHub에 프로젝트 푸시
2. [Vercel 대시보드](https://vercel.com/dashboard)에서 "Import Project" 클릭
3. GitHub 리포지토리 선택
4. Root Directory를 그대로 두고 배포

#### 방법 2: CLI 사용
```bash
vercel --prod
```

### 5. 환경 변수 설정
Vercel 대시보드에서 다음 환경 변수들을 설정:

**Production, Preview, Development 모두에 설정:**
- `GOOGLE_GEOLOCATION_API_KEY`
- `GOOGLE_MAPS_API_KEY` 
- `GOOGLE_GEMINI_API_KEY`
- `VITE_KAKAO_MAP_API_KEY`

### 6. 배포 확인
- 배포된 URL에서 앱이 정상 작동하는지 확인
- API 엔드포인트들이 작동하는지 확인 (`/api/health`)

## 📱 웹/앱 동시 사용

배포 후 다음과 같이 사용 가능:
- **웹**: 배포된 Vercel URL에서 직접 접속
- **모바일 앱**: WebView나 Capacitor/Cordova로 래핑하여 네이티브 앱으로 변환

## 🔧 문제 해결

### 빌드 오류 시:
```bash
# 의존성 다시 설치
rm -rf node_modules package-lock.json
npm install

# 빌드 테스트
npm run vercel-build
```

### API 오류 시:
- Vercel 대시보드에서 Functions 탭 확인
- 환경 변수가 올바르게 설정되었는지 확인
- 로그 확인

## 🌐 도메인 설정

Vercel에서 커스텀 도메인 연결 가능:
1. 도메인 구매
2. Vercel 대시보드 > Domains에서 도메인 추가
3. DNS 설정 업데이트
