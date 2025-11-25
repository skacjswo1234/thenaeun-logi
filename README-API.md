# 블로그 자동 배포 시스템 - Cloudflare Workers API

Cloudflare Workers를 사용한 서버리스 백엔드 API입니다.

## 기능

- ✅ 블로그 글 관리 (생성, 조회, 수정, 삭제)
- ✅ 글 발행 기능 (자동 배포 트리거)
- ✅ 문의하기 폼 연동
- ✅ KV 저장소를 사용한 데이터 저장
- ✅ CORS 지원

## 설치 및 설정

### 1. 의존성 설치

```bash
npm install
```

### 2. Cloudflare Workers 계정 설정

1. [Cloudflare Dashboard](https://dash.cloudflare.com)에 로그인
2. Workers & Pages 메뉴로 이동
3. 계정 생성 또는 로그인

### 3. KV 네임스페이스 생성

KV 네임스페이스는 블로그 글을 저장하는데 사용됩니다.

```bash
# KV 네임스페이스 생성
npx wrangler kv:namespace create "BLOG_STORAGE"

# 프리뷰용 네임스페이스 생성 (로컬 개발용)
npx wrangler kv:namespace create "BLOG_STORAGE" --preview
```

생성된 네임스페이스 ID를 `wrangler.toml` 파일에 업데이트하세요:

```toml
[[kv_namespaces]]
binding = "BLOG_STORAGE"
id = "생성된_네임스페이스_ID"
preview_id = "생성된_프리뷰_네임스페이스_ID"
```

### 4. 로컬 개발

```bash
npm run dev
```

이 명령은 로컬에서 Workers를 실행합니다. 기본적으로 `http://localhost:8787`에서 접근 가능합니다.

### 5. 배포

```bash
npm run deploy
```

배포 후 제공되는 Workers URL을 복사하여 프론트엔드에서 사용하세요.

## API 엔드포인트

### 블로그 글 관리

#### 모든 글 조회
```http
GET /api/posts
```

응답:
```json
{
  "posts": [
    {
      "id": "1234567890-abc123",
      "title": "글 제목",
      "content": "글 내용",
      "platform": "naver",
      "category": "",
      "tags": [],
      "status": "draft",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "total": 1
}
```

#### 특정 글 조회
```http
GET /api/posts/:id
```

#### 새 글 생성
```http
POST /api/posts
Content-Type: application/json

{
  "title": "글 제목",
  "content": "글 내용",
  "platform": "naver",
  "category": "카테고리",
  "tags": ["태그1", "태그2"],
  "status": "draft",
  "scheduledAt": "2024-01-01T10:00:00.000Z"
}
```

#### 글 수정
```http
PUT /api/posts/:id
Content-Type: application/json

{
  "title": "수정된 제목",
  "content": "수정된 내용"
}
```

#### 글 삭제
```http
DELETE /api/posts/:id
```

#### 글 발행
```http
POST /api/posts/:id/publish
```

### 문의하기

#### 문의 제출
```http
POST /api/contact
Content-Type: application/json

{
  "name": "홍길동",
  "phone": "010-1234-5678",
  "email": "example@email.com",
  "message": "문의 내용"
}
```

## 프론트엔드 연동

프론트엔드에서 API를 사용하려면 `index.html`에 다음 스크립트를 추가하세요:

```html
<script>
  // Workers 배포 후 받은 URL로 변경
  window.API_BASE_URL = 'https://your-worker-name.your-subdomain.workers.dev/api';
</script>
<script src="script.js"></script>
```

## 블로그 자동 배포 연동

현재 API는 글 저장 및 관리를 담당합니다. 실제 블로그 플랫폼에 자동으로 배포하려면:

1. **별도 자동화 서버 필요** (Puppeteer/Selenium 사용)
   - Python Flask/FastAPI 서버
   - Node.js Express 서버
   
2. **Workers에서 자동화 서버 호출**
   - `publishPost` 함수에서 외부 API 호출
   - Queue Workers 사용하여 비동기 처리

3. **스케줄러 설정**
   - Cron Triggers 사용
   - 예약된 글 자동 발행

## 개발 팁

- 로컬 개발시 KV는 프리뷰 네임스페이스를 사용합니다
- 실제 데이터와 분리하려면 별도 네임스페이스 사용 권장
- 환경 변수는 `wrangler.toml`의 `[vars]` 섹션에서 설정 가능

## 참고 자료

- [Cloudflare Workers 문서](https://developers.cloudflare.com/workers/)
- [KV 저장소 문서](https://developers.cloudflare.com/kv/)
- [Wrangler CLI 문서](https://developers.cloudflare.com/workers/wrangler/)

