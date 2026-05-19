# Inquiry(문의하기) 기능 문서

> **작성일**: 2026-05-19  
> **버전**: v1.0  
> **상태**: 구현 완료

---

## 개요

사용자가 서비스 이용 중 문제를 보고하거나 기능 제안을 할 수 있는 기능입니다.

**핵심 특징**:
- 7가지 카테고리로 분류 가능 (초대장, 사진, 알림, 미션, 버그, 기능 요청, 기타)
- 문의 상태 관리 (답변 대기 → 답변 중 → 해결)
- Pending 상태에서만 수정/삭제 가능
- 관리자는 모든 문의 조회 및 답변 가능

---

## 상태 흐름

```
pending (답변 대기)
    ↓
in_progress (답변 중) ← 사용자는 이 상태에서 수정 불가
    ↓
resolved (해결됨)
```

**규칙**:
- 생성 직후: 자동으로 `pending` 상태
- Pending 상태일 때만 수정/삭제 가능
- 관리자가 답변을 등록하면 상태 업데이트 가능

---

## 문의 타입(inquiryType)

| 타입 | 설명 |
|------|------|
| `invitation` | 초대장 관련 문의 |
| `photo` | 사진 기능 관련 문의 |
| `notification` | 알림 관련 문의 |
| `mission` | 미션 관련 문의 |
| `bug` | 버그 신고 |
| `feature` | 기능 요청 |
| `general` | 기타 문의 |

---

## API 엔드포인트

### 유저 API

#### 1. 문의 생성

```http
POST /api/v1/inquiries
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "inquiryType": "bug",
  "title": "사진 업로드 시 오류 발생",
  "content": "10MB 이상의 사진을 업로드하려고 하면 항상 실패합니다."
}
```

**응답 (201 Created)**:
```json
{
  "success": true,
  "data": {
    "id": "01ARZ3NDEKTSV4RRFFQ69G5FAV",
    "userId": "01ARZ3NDEKTSV4RRFFQ69G5FAC",
    "inquiryType": "bug",
    "status": "pending",
    "title": "사진 업로드 시 오류 발생",
    "content": "10MB 이상의 사진을 업로드하려고 하면 항상 실패합니다.",
    "answer": null,
    "answeredAt": null,
    "adminId": null,
    "createdAt": "2026-05-19T10:30:00.000Z",
    "updatedAt": "2026-05-19T10:30:00.000Z"
  },
  "meta": {
    "requestId": "uuid-v4",
    "timestamp": "2026-05-19T10:30:00.000Z"
  }
}
```

**검증 규칙**:
- `inquiryType`: 위의 7가지 타입 중 하나
- `title`: 1~200자
- `content`: 1~5000자

---

#### 2. 내 문의 목록 조회

```http
GET /api/v1/inquiries/me
Authorization: Bearer {accessToken}
```

**응답 (200 OK)**:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "01ARZ3NDEKTSV4RRFFQ69G5FAV",
        "userId": "01ARZ3NDEKTSV4RRFFQ69G5FAC",
        "inquiryType": "bug",
        "status": "pending",
        "title": "사진 업로드 시 오류 발생",
        "content": "10MB 이상의 사진을 업로드하려고 하면 항상 실패합니다.",
        "answer": null,
        "answeredAt": null,
        "adminId": null,
        "createdAt": "2026-05-19T10:30:00.000Z",
        "updatedAt": "2026-05-19T10:30:00.000Z"
      }
    ],
    "total": 1
  },
  "meta": {
    "requestId": "uuid-v4",
    "timestamp": "2026-05-19T10:30:00.000Z"
  }
}
```

**특징**:
- 최신순 정렬 (createdAt 역순)
- Soft delete된 문의는 제외 (deletedAt IS NULL)
- `total`: 조회된 전체 문의 개수

---

#### 3. 문의 상세 조회

```http
GET /api/v1/inquiries/:id
Authorization: Bearer {accessToken}
```

**응답 (200 OK)**:
```json
{
  "success": true,
  "data": {
    "id": "01ARZ3NDEKTSV4RRFFQ69G5FAV",
    "userId": "01ARZ3NDEKTSV4RRFFQ69G5FAC",
    "inquiryType": "bug",
    "status": "pending",
    "title": "사진 업로드 시 오류 발생",
    "content": "10MB 이상의 사진을 업로드하려고 하면 항상 실패합니다.",
    "answer": null,
    "answeredAt": null,
    "adminId": null,
    "createdAt": "2026-05-19T10:30:00.000Z",
    "updatedAt": "2026-05-19T10:30:00.000Z"
  },
  "meta": {
    "requestId": "uuid-v4",
    "timestamp": "2026-05-19T10:30:00.000Z"
  }
}
```

**권한**:
- 본인의 문의만 조회 가능
- 다른 사람의 문의 조회 시 404 반환 (보안상 존재 여부 숨김)

---

#### 4. 문의 수정

```http
PATCH /api/v1/inquiries/:id
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "title": "[수정됨] 사진 업로드 시 오류 발생",
  "content": "10MB 이상의 사진을 업로드하려고 하면 항상 실패합니다. 추가 테스트 결과..."
}
```

**응답 (200 OK)**:
```json
{
  "success": true,
  "data": {
    "id": "01ARZ3NDEKTSV4RRFFQ69G5FAV",
    "userId": "01ARZ3NDEKTSV4RRFFQ69G5FAC",
    "inquiryType": "bug",
    "status": "pending",
    "title": "[수정됨] 사진 업로드 시 오류 발생",
    "content": "10MB 이상의 사진을 업로드하려고 하면 항상 실패합니다. 추가 테스트 결과...",
    "answer": null,
    "answeredAt": null,
    "adminId": null,
    "createdAt": "2026-05-19T10:30:00.000Z",
    "updatedAt": "2026-05-19T10:35:15.000Z"
  },
  "meta": {
    "requestId": "uuid-v4",
    "timestamp": "2026-05-19T10:35:15.000Z"
  }
}
```

**규칙**:
- `pending` 상태일 때만 수정 가능
- `in_progress` 또는 `resolved` 상태에서 수정 시도 시 409 Conflict 반환
- `inquiryType`은 수정 불가 (생성 시에만 지정)
- 본인의 문의만 수정 가능

---

#### 5. 문의 삭제 (소프트 삭제)

```http
DELETE /api/v1/inquiries/:id
Authorization: Bearer {accessToken}
```

**응답 (204 No Content)**:
```
(빈 응답)
```

**규칙**:
- Soft delete (deletedAt 타임스탬프 기록)
- `pending` 상태일 때만 삭제 가능
- 본인의 문의만 삭제 가능

---

### 관리자 API

> 모든 관리자 API는 `@AdminOnly()` 데코레이터로 보호됨  
> 관리자(ADMIN 역할)만 접근 가능

#### 1. 전체 문의 목록 조회

```http
GET /api/v1/admin/inquiries
Authorization: Bearer {adminAccessToken}
```

**응답 (200 OK)**:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "01ARZ3NDEKTSV4RRFFQ69G5FAV",
        "userId": "01ARZ3NDEKTSV4RRFFQ69G5FAC",
        "inquiryType": "bug",
        "status": "pending",
        "title": "사진 업로드 시 오류 발생",
        "content": "...",
        "answer": null,
        "answeredAt": null,
        "adminId": null,
        "createdAt": "2026-05-19T10:30:00.000Z",
        "updatedAt": "2026-05-19T10:30:00.000Z"
      },
      {
        "id": "01ARZ3NDEKTSV4RRFFQ69G5FAD",
        "userId": "01ARZ3NDEKTSV4RRFFQ69G5FAE",
        "inquiryType": "feature",
        "status": "in_progress",
        "title": "어두운 테마 지원",
        "content": "...",
        "answer": null,
        "answeredAt": null,
        "adminId": "01ARZ3NDEKTSV4RRFFQ69G5FAM",
        "createdAt": "2026-05-18T14:20:00.000Z",
        "updatedAt": "2026-05-18T14:20:00.000Z"
      }
    ],
    "total": 2
  },
  "meta": {
    "requestId": "uuid-v4",
    "timestamp": "2026-05-19T10:40:00.000Z"
  }
}
```

**특징**:
- 최신순 정렬 (createdAt 역순)
- `total`: 전체 문의 개수 (soft delete 제외)
- 모든 사용자의 문의 조회 가능

---

#### 2. 문의 상세 조회 (관리자)

```http
GET /api/v1/admin/inquiries/:id
Authorization: Bearer {adminAccessToken}
```

**응답**: 유저 API의 상세 조회와 동일한 구조

**차이점**:
- 소유권 체크 없음 (모든 문의 조회 가능)
- 404 반환 시: 문의 자체가 없을 때만

---

#### 3. 문의에 답변 등록/수정

```http
PATCH /api/v1/admin/inquiries/:id/answer
Authorization: Bearer {adminAccessToken}
Content-Type: application/json

{
  "answer": "확인 결과, 브라우저 캐시 문제였습니다. 다음 버전에서 수정되었습니다.",
  "status": "resolved"
}
```

**응답 (200 OK)**:
```json
{
  "success": true,
  "data": {
    "id": "01ARZ3NDEKTSV4RRFFQ69G5FAV",
    "userId": "01ARZ3NDEKTSV4RRFFQ69G5FAC",
    "inquiryType": "bug",
    "status": "resolved",
    "title": "사진 업로드 시 오류 발생",
    "content": "10MB 이상의 사진을 업로드하려고 하면 항상 실패합니다.",
    "answer": "확인 결과, 브라우저 캐시 문제였습니다. 다음 버전에서 수정되었습니다.",
    "answeredAt": "2026-05-19T10:45:00.000Z",
    "adminId": "01ARZ3NDEKTSV4RRFFQ69G5FAM",
    "createdAt": "2026-05-19T10:30:00.000Z",
    "updatedAt": "2026-05-19T10:45:00.000Z"
  },
  "meta": {
    "requestId": "uuid-v4",
    "timestamp": "2026-05-19T10:45:00.000Z"
  }
}
```

**규칙**:
- `answer`: 1~5000자
- `status`: `in_progress` 또는 `resolved`
- 답변 등록 시 자동으로 `answeredAt` 타임스탐프 기록
- 답변 등록 시 `adminId`는 요청한 관리자의 ID로 자동 설정
- `status` 변경 가능 (pending → in_progress → resolved 외의 경로도 가능)

---

## 에러 코드

| 코드 | HTTP 상태 | 상황 |
|------|:--------:|------|
| `INQUIRY_NOT_FOUND` | 404 | 문의가 없거나 접근 권한 없음 |
| `VALIDATION_ERROR` | 400 | DTO 검증 실패 (title, content 길이 등) |
| `INSUFFICIENT_ROLE` | 403 | 관리자 API에 비관리자가 접근 |

**에러 응답 예시**:
```json
{
  "success": false,
  "error": {
    "code": "INQUIRY_NOT_FOUND",
    "type": "not_found",
    "message": "문의를 찾을 수 없습니다.",
    "details": {}
  },
  "meta": {
    "requestId": "uuid-v4",
    "timestamp": "2026-05-19T10:50:00.000Z"
  }
}
```

---

## 로컬 테스트 방법

### 1. Dev Token 발급

개발 환경에서는 소셜 로그인이 없기 때문에, **dev 엔드포인트**로 JWT 토큰을 발급합니다.

```bash
curl -X POST http://localhost:3002/api/v1/auth/dev/token \
  -H "Content-Type: application/json" \
  -d '{"email": "host1@wara.dev"}'
```

**응답**:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**사용 가능한 시드 유저 이메일**:
- Host: `host1@wara.dev` ~ `host4@wara.dev`
- Guest: `guest01@wara.dev` ~ `guest14@wara.dev`
- Admin: `admin@wara.dev` (관리자 API 테스트 용)

### 2. Postman에서 테스트

**Pre-request Script** (자동 토큰 갱신):
```javascript
// Dev token 발급
const url = pm.environment.get('base_url') + '/auth/dev/token';
const payload = {
  email: pm.environment.get('dev_email')
};

pm.sendRequest({
  url: url,
  method: 'POST',
  header: {
    'Content-Type': 'application/json'
  },
  body: {
    mode: 'raw',
    raw: JSON.stringify(payload)
  }
}, function(error, response) {
  if (!error) {
    const token = response.json().accessToken;
    pm.environment.set('accessToken', token);
  }
});
```

**Environment 설정**:
```json
{
  "base_url": "http://localhost:3002/api/v1",
  "dev_email": "host1@wara.dev",
  "accessToken": ""
}
```

### 3. 예제 API 호출

**문의 생성**:
```bash
curl -X POST http://localhost:3002/api/v1/inquiries \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "inquiryType": "bug",
    "title": "테스트 버그",
    "content": "테스트 버그 내용입니다."
  }'
```

**내 문의 목록**:
```bash
curl -X GET http://localhost:3002/api/v1/inquiries/me \
  -H "Authorization: Bearer $TOKEN"
```

**관리자: 전체 문의 목록** (admin@wara.dev 토큰 필요):
```bash
curl -X GET http://localhost:3002/api/v1/admin/inquiries \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

**관리자: 문의에 답변**:
```bash
curl -X PATCH http://localhost:3002/api/v1/admin/inquiries/:id/answer \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "answer": "확인되었습니다. 다음 버전에서 수정될 예정입니다.",
    "status": "resolved"
  }'
```

---

## 구현 세부사항

### 파일 구조

```
apps/api/src/inquiries/
├── inquiries.module.ts                 # DI 설정
├── inquiries.controller.ts             # 유저 API (POST, GET /me, GET /:id, PATCH /:id, DELETE /:id)
├── admin-inquiries.controller.ts       # 관리자 API (GET, GET /:id, PATCH /:id/answer)
├── inquiries.service.ts                # 비즈니스 로직
├── inquiries.repository.ts             # DB 쿼리
└── dto/
    ├── create-inquiry.dto.ts           # POST /inquiries 검증
    ├── update-inquiry.dto.ts           # PATCH /inquiries/:id 검증
    └── answer-inquiry.dto.ts           # PATCH /admin/inquiries/:id/answer 검증

apps/api/drizzle/
├── schema/
│   └── inquiries.ts                    # inquiries 테이블 정의
└── migrations/
    ├── 0009_chubby_vin_gonzales.sql   # 전체 스키마 (inquiries 포함)
    └── 0001_clammy_stark_industries.sql # inquiry_type enum 추가 (bug, feature)
```

### 데이터 베이스 스키마

```sql
CREATE TABLE inquiries (
  id TEXT PRIMARY KEY DEFAULT gen_ulid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  inquiry_type inquiry_type_enum NOT NULL,
  status inquiry_status_enum NOT NULL DEFAULT 'pending',
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  answer TEXT,
  answered_at TIMESTAMP WITH TIME ZONE,
  admin_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE,
  
  INDEX idx_inquiries_user_id ON user_id,
  INDEX idx_inquiries_deleted_at ON deleted_at WHERE deleted_at IS NULL
);

-- enum types
CREATE TYPE inquiry_type_enum AS ENUM (
  'invitation', 'photo', 'notification', 'mission', 'bug', 'feature', 'general'
);

CREATE TYPE inquiry_status_enum AS ENUM (
  'pending', 'in_progress', 'resolved'
);
```

### 핵심 로직

**InquiriesService**:
- `create()` — 문의 생성, 기본 상태 `pending`
- `findById()` — 본인의 문의만 조회 (소유권 체크)
- `update()` — `pending` 상태일 때만 수정 가능
- `softDelete()` — `pending` 상태일 때만 삭제 가능
- `answer()` — 관리자가 답변 등록, `answeredAt` 자동 기록

**InquiriesRepository**:
- `findByUserId()` — 유저별 문의 목록 + 개수
- `findAll()` — 전체 문의 목록 + 개수 (관리자용)
- `answer()` — 답변 등록 시 `answer`, `status`, `adminId`, `answeredAt` 함께 업데이트

---

## 마이그레이션 히스토리

| 번호 | 설명 |
|------|------|
| `0009` | 전체 스키마 squash (inquiries 테이블 포함) |
| `0001` | inquiry_type enum에 `bug`, `feature` 추가 |

**주의**: 마이그레이션은 순차적으로 실행되어야 하며, 이미 적용된 마이그레이션은 다시 실행할 수 없습니다.

---

## 참고

- **CLAUDE.md 규칙**: Soft delete 우선, 에러 코드는 error-codes.ts 참조
- **API 설계**: docs/api/api.md의 Inquiries 섹션
- **에러 코드**: docs/conventions/error-codes.md
- **DB 스키마**: docs/db/WARA_ERD_v0.6.1.md
