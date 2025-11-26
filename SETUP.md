# Cloudflare Workers 백엔드 설정 가이드

## 빠른 시작

### 1단계: Node.js 설치 확인
```bash
node --version
npm --version
```

### 2단계: Cloudflare 계정 생성
1. [Cloudflare](https://dash.cloudflare.com/sign-up)에서 계정 생성
2. 로그인 후 Workers & Pages 메뉴 확인

### 3단계: 의존성 설치
```bash
npm install
```

### 4단계: Cloudflare 로그인
```bash
npx wrangler login
```
브라우저가 열리면 Cloudflare 계정으로 로그인

### 5단계: KV 네임스페이스 생성

#### 프로덕션용 네임스페이스
```bash
npx wrangler kv:namespace create "BLOG_STORAGE"
```

출력 예시:
```
✅  Successfully created namespace "BLOG_STORAGE"
        ID = "abc123def456..."
```

#### 개발/프리뷰용 네임스페이스
```bash
npx wrangler kv:namespace create "BLOG_STORAGE" --preview
```

출력 예시:
```
✅  Successfully created namespace "BLOG_STORAGE" with preview
        ID = "xyz789uvw012..."
```

### 6단계: wrangler.toml 설정

생성된 ID를 `wrangler.toml` 파일에 업데이트:

```toml
[[kv_namespaces]]
binding = "BLOG_STORAGE"
id = "프로덕션_ID_여기에_붙여넣기"
preview_id = "프리뷰_ID_여기에_붙여넣기"
```

### 7단계: 로컬 개발 서버 실행
```bash
npm run dev
```

서버가 시작되면:
- API: http://localhost:8787/api
- API 정보: http://localhost:8787/api/

### 8단계: 배포

```bash
npm run deploy
```

배포 후 출력되는 URL 예시:
```
✨  Success! Deployed to https://blog-api.your-subdomain.workers.dev
```

이 URL을 복사하세요!

### 9단계: 프론트엔드 API URL 설정

`index.html` 파일의 API URL을 업데이트:

```html
<script>
    window.API_BASE_URL = 'https://blog-api.your-subdomain.workers.dev/api';
</script>
```

## API 테스트

### cURL로 테스트

```bash
# API 정보 확인
curl https://your-worker-url.workers.dev/api

# 새 글 생성
curl -X POST https://your-worker-url.workers.dev/api/posts \
  -H "Content-Type: application/json" \
  -d '{
    "title": "테스트 글",
    "content": "내용입니다",
    "platform": "naver"
  }'

# 모든 글 조회
curl https://your-worker-url.workers.dev/api/posts
```

## 트러블슈팅

### KV 네임스페이스 오류
- `wrangler.toml`의 ID가 정확한지 확인
- KV 네임스페이스가 생성되었는지 대시보드에서 확인

### 배포 실패
- Cloudflare에 로그인했는지 확인: `npx wrangler whoami`
- 계정에 Workers 사용 권한이 있는지 확인

### CORS 오류
- Workers 코드의 `corsHeaders`가 올바르게 설정되었는지 확인
- 브라우저 콘솔에서 정확한 오류 메시지 확인

## 다음 단계

1. ✅ API가 정상 작동하는지 테스트
2. ✅ 프론트엔드 문의폼과 연동 테스트
3. ✅ 블로그 자동 배포 기능 추가 (별도 서버 필요)
4. ✅ 스케줄링 기능 추가 (Cron Triggers)

## 비용

Cloudflare Workers 무료 티어:
- 일일 100,000 요청
- 월 100,000 요청 (더 많은 요청은 유료)

KV 저장소:
- 읽기: 일일 100,000건 무료
- 쓰기: 일일 1,000건 무료

대부분의 개인/소규모 프로젝트는 무료 티어로 충분합니다!



