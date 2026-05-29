# 이용약관 기능 구현 계획

> 브랜치: `feat/service-term`
> 상태: 구현 전 (계획 확정)

---

## 스코프 확정

- 복수 약관 (`service` / `privacy` / `marketing`)
- 버전 관리 (개정 이력 전체 보관)
- 사용자 동의 이력 추적
- 필수 약관 미동의 시 API 차단 (Guard)

---

## DB 스키마 (2개 테이블)

### `service_terms` — 약관 버전 관리

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | text (ulid) | PK |
| term_type | enum | `service` \| `privacy` \| `marketing` |
| version | varchar | 예: `v1.0`, `v1.1` |
| title | varchar | 약관 제목 |
| content | text | 약관 본문 (나중에 파일로 채움) |
| is_active | boolean | 현재 적용 중인 버전 (type당 1개) |
| is_required | boolean | 필수 동의 여부 |
| published_at | timestamp | 시행일 |
| created_by | text | 관리자 FK |
| created_at | timestamp | |
| updated_at | timestamp | |
| deleted_at | timestamp | soft delete |

### `user_term_agreements` — 사용자 동의 이력

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | text (ulid) | PK |
| user_id | text | FK → users |
| term_id | text | FK → service_terms |
| agreed_at | timestamp | 동의 시각 |

- unique: `(user_id, term_id)` — 같은 버전 중복 동의 방지
- immutable (수정/삭제 없음)

---

## API 엔드포인트 (9개)

| Method | Path | 인증 | 설명 |
|--------|------|:----:|------|
| GET | `/terms` | ❌ | 현재 활성 약관 전체 목록 (`is_active=true`) |
| GET | `/terms/:id` | ❌ | 특정 버전 상세 조회 |
| POST | `/terms/agreements` | ✅ | 약관 동의 기록 (body: `{ termIds: string[] }`) |
| GET | `/terms/agreements/me` | ✅ | 내 동의 이력 조회 |
| GET | `/admin/terms` | ✅ admin | 전체 약관 목록 (버전 이력 포함) |
| POST | `/admin/terms` | ✅ admin | 새 약관 버전 등록 |
| PATCH | `/admin/terms/:id` | ✅ admin | 약관 내용 수정 |
| PATCH | `/admin/terms/:id/activate` | ✅ admin | 해당 버전을 활성 버전으로 지정 |
| DELETE | `/admin/terms/:id` | ✅ admin | soft delete |

---

## 모듈 구조

```
apps/api/src/
  database/schema/
    terms.ts                   # 새 스키마
  terms/
    terms.module.ts
    terms.controller.ts
    admin-terms.controller.ts
    terms.service.ts
    terms.repository.ts
    dto/
      create-term.dto.ts
      update-term.dto.ts
      agree-terms.dto.ts
```

---

## Guard

- `RequiredTermsGuard`: 필수 약관 미동의 시 차단
- 적용 방식: **글로벌** — `APP_GUARD`로 전체 적용, 인증 불필요 라우트는 `@Public()` 데코레이터로 스킵

---

## 에러 코드 추가 필요

| 코드 | 상태코드 | 상황 |
|------|:--------:|------|
| `TERMS_AGREEMENT_REQUIRED` | 403 | 필수 약관 미동의 상태로 API 접근 |
| `TERM_NOT_FOUND` | 404 | 약관 없음 |
| `TERM_AGREEMENT_ALREADY_EXISTS` | 409 | 이미 동의한 버전에 재동의 시도 |

---

## 미결 사항

- [x] `RequiredTermsGuard` 적용 방식: 글로벌로 확정
- [ ] 약관 본문 파일 추가 시점 확인
