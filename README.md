# 더나은물류 - 문의 관리 시스템

Cloudflare Pages Functions와 D1 데이터베이스를 사용한 문의 관리 시스템입니다.

## 프로젝트 구조

```
프로젝트/
├── functions/                    # Pages Functions API
│   ├── _utils.js                # 공통 유틸리티 (CORS, 응답 생성)
│   ├── _middleware.js           # 미들웨어 (CORS 처리)
│   └── api/
│       ├── contact.js           # POST /api/contact
│       └── admin/
│           ├── contacts.js      # GET /api/admin/contacts
│           └── contacts/
│               └── [id].js       # GET/PUT/DELETE /api/admin/contacts/:id
├── migrations/                  # D1 데이터베이스 마이그레이션
│   └── 0001_create_contacts_table.sql
├── index.html                   # 메인 페이지
├── admin.html                   # 관리자 페이지
├── admin.js                     # 관리자 페이지 스크립트
├── admin.css                    # 관리자 페이지 스타일
├── script.js                    # 메인 페이지 스크립트
├── styles.css                   # 메인 페이지 스타일
└── images/                      # 이미지 및 비디오 파일
```

## 빠른 시작

### 1. Cloudflare Pages 프로젝트 생성

1. [Cloudflare Dashboard](https://dash.cloudflare.com)에 로그인
2. **Workers & Pages** > **Create application** > **Pages** 선택
3. GitHub 저장소 연결 또는 직접 업로드

### 2. D1 데이터베이스 생성 및 바인딩

#### D1 데이터베이스 생성
```bash
npx wrangler d1 create thenaeun-logi-db
```

생성된 Database ID를 기록해두세요.

#### Pages에서 D1 바인딩 설정
1. Pages 프로젝트 선택
2. **Settings** > **Functions** > **D1 Database bindings** 섹션
3. **Add binding** 클릭
4. 설정:
   - **Variable name**: `thenaeun-logi-db`
   - **D1 Database**: `thenaeun-logi-db` 선택
   - **Database ID**: 생성한 Database ID 입력

### 3. 마이그레이션 실행

```bash
# 문의 테이블 생성
npx wrangler d1 execute thenaeun-logi-db --file=./migrations/0001_create_contacts_table.sql

# 관리자 테이블 생성 (기본 계정: admin / admin123)
npx wrangler d1 execute thenaeun-logi-db --file=./migrations/0002_create_admin_table.sql
```

**중요**: 배포 후 반드시 기본 비밀번호(`admin123`)를 변경하세요!

### 4. 배포

#### GitHub 연결 시
- 코드를 푸시하면 자동 배포됩니다.

#### 수동 배포
```bash
npx wrangler pages deploy .
```

## 로컬 개발

### Pages Functions 로컬 개발
```bash
npm run dev
```

또는

```bash
npx wrangler pages dev .
```

### 로컬 D1 데이터베이스 설정

```bash
# 로컬 D1 데이터베이스 생성
npx wrangler d1 create thenaeun-logi-db --local

# 마이그레이션 실행
npx wrangler d1 execute thenaeun-logi-db --local --file=./migrations/0001_create_contacts_table.sql
```

## 로그인

### 기본 관리자 계정
- **사용자명**: `admin`
- **비밀번호**: `admin123`

**⚠️ 보안**: 배포 후 반드시 비밀번호를 변경하세요!

### 로그인 화면
- `login.html` - 관리자 로그인 페이지
- 로그인 성공 시 `admin.html`로 이동
- 로그인 상태는 localStorage에 저장

## API 엔드포인트

### 문의하기 (일반 사용자)
- `POST /api/contact` - 문의 접수
  ```json
  {
    "name": "홍길동",
    "phone": "010-1234-5678",
    "age": 30,
    "message": "문의 내용"
  }
  ```

### 인증 API
- `POST /api/auth/login` - 관리자 로그인
  ```json
  {
    "username": "admin",
    "password": "admin123"
  }
  ```
- `POST /api/auth/change-password` - 비밀번호 변경
  ```json
  {
    "username": "admin",
    "oldPassword": "admin123",
    "newPassword": "새비밀번호"
  }
  ```

### 관리자 API
- `GET /api/admin/contacts` - 모든 문의 조회
  - Query 파라미터: `page`, `limit`, `status` (new, read, replied)
- `GET /api/admin/contacts/:id` - 특정 문의 조회
- `PUT /api/admin/contacts/:id` - 문의 상태 업데이트
  ```json
  {
    "status": "read"  // new, read, replied
  }
  ```
- `DELETE /api/admin/contacts/:id` - 문의 삭제

## 데이터베이스 스키마

### admin 테이블

| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| id | INTEGER | 기본 키 (자동 증가) |
| username | TEXT | 사용자명 (기본값: 'admin') |
| password | TEXT | 비밀번호 (평문 저장) |
| created_at | TEXT | 생성일시 |
| updated_at | TEXT | 수정일시 |

### contacts 테이블

| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| id | INTEGER | 기본 키 (자동 증가) |
| name | TEXT | 이름 (필수) |
| phone | TEXT | 연락처 |
| age | INTEGER | 나이 |
| message | TEXT | 문의내용 (필수) |
| status | TEXT | 상태: 'new', 'read', 'replied' |
| created_at | TEXT | 생성일시 |
| updated_at | TEXT | 수정일시 |

## 문제 해결

### D1 바인딩 오류
- Dashboard에서 Functions > D1 Database bindings 확인
- Variable name이 `thenaeun-logi-db`인지 확인

### API 404 오류
- `functions/` 폴더 구조 확인
- 파일명과 경로가 올바른지 확인

### CORS 오류
- `functions/_middleware.js` 확인
- `functions/_utils.js`의 CORS 헤더 확인

### 마이그레이션 오류
- SQL 파일 경로가 올바른지 확인
- 데이터베이스 이름이 올바른지 확인

## 기술 스택

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Cloudflare Pages Functions
- **Database**: Cloudflare D1 (SQLite)
- **Deployment**: Cloudflare Pages

