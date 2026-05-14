# 와라 API 에러 코드 명세

본 문서는 와라 API가 throw하는 모든 에러 코드의 **단일 진실 공급원(SSOT)** 이다.
새 코드를 추가하거나 기존 코드를 변경할 때는 본 문서를 함께 갱신한다.

---

## 응답 형식

모든 실패 응답은 동일한 envelope을 따른다 (Stripe 패턴).

```json
{
  "success": false,
  "error": {
    "code": "TOKEN_EXPIRED",
    "type": "authentication",
    "message": "TOKEN_EXPIRED"
  },
  "meta": {
    "requestId": "8d7e2c4f-9a1b-4d6e-...",
    "timestamp": "2026-05-13T01:30:00.000Z"
  }
}
```

변환 책임: `apps/api/src/common/filters/all-exceptions.filter.ts` + `error-response.helper.ts`. Guard/Service는 `throw new XxxException('CODE')` 형태로 code만 던지면 Filter가 envelope으로 감싼다.

---

## type 분류 (HTTP status 매핑)

| `error.type` | HTTP | 의미 |
|---|---|---|
| `invalid_request` | 400, 422 | 요청 형식·필드 오류 (DTO 검증 실패 포함) |
| `authentication` | 401 | 신원 미증명 (토큰 누락·만료·위조) |
| `authorization` | 403 | 신원은 OK이나 권한 부족 |
| `not_found` | 404 | 리소스 없음 |
| `conflict` | 409 | 상태 충돌 (중복 생성, 동시 수정 등) |
| `rate_limit` | 429 | 호출 빈도 초과 |
| `service_unavailable` | 503 | 외부 의존성 일시 장애 |
| `server_error` | 500 (기본) | 그 외 |

매핑 로직: `error-response.helper.ts`의 `statusToType()`.

---

## 코드 목록

### Auth — 인증 (담당: 1조 / 숙희)

| code | HTTP | type | 발생 조건 |
|---|---|---|---|
| `TOKEN_EXPIRED` | 401 | authentication | `JwtService.verifyAsync()`가 `TokenExpiredError` |
| `TOKEN_INVALID` | 401 | authentication | JWT 서명 검증 실패 또는 토큰 누락 (헤더 + 쿠키 모두 없음) |
| `PASSWORD_REQUIRED` | 401 | authentication | private invitation 접근 토큰이 없거나 무효 |

### Authorization — Guard 인가 (담당: 수훈)

| code | HTTP | type | 발생 조건 |
|---|---|---|---|
| `INSUFFICIENT_ROLE` | 403 | authorization | `RolesGuard` 또는 `HostGuard`에서 `user.role` / `member_role` 매칭 실패 |
| `ACCESS_REVOKED` | 403 | authorization | `BlocklistGuard` — invitation_blocklists에 차단된 user (admin 제외) |

### Admin — 관리자 작업 (담당: 수훈)

| code | HTTP | type | 발생 조건 |
|---|---|---|---|
| `CANNOT_DEMOTE_SELF` | 403 | authorization | admin이 자기 자신의 role을 `'member'`로 변경 시도 |
| `CANNOT_DEMOTE_LAST_ADMIN` | 403 | authorization | 시스템에 admin이 1명 이하일 때 강등 시도 |
| `USER_NOT_FOUND` | 404 | not_found | `PATCH /admin/users/:id/status` 대상 user 없음 |
| `INVITATION_NOT_FOUND` | 404 | not_found | `PATCH /admin/invitations/:id/status` 대상 invitation 없음 |

### Validation — 입력 검증

| code | HTTP | type | 발생 조건 |
|---|---|---|---|
| `INVALID_REQUEST` | 400 | invalid_request | 기본 잘못된 요청 |
| `VALIDATION_ERROR` | 422 | invalid_request | Zod 스키마 검증 실패 (필드 단위) |
| `AT_LEAST_ONE_FIELD_REQUIRED` | 400 | invalid_request | `UpdateUserStatusDto` 같이 최소 1개 필드 필수인 DTO에서 모두 누락 |

### Pre-condition — 가드 사전 조건

| code | HTTP | type | 발생 조건 |
|---|---|---|---|
| `INVITATION_ID_REQUIRED` | 400 | invalid_request | `HostGuard`/`BlocklistGuard`/`PrivateInvitationGuard` 사용 endpoint에 `:invitationId` path param 누락 |

### Generic — 시스템

| code | HTTP | type | 발생 조건 |
|---|---|---|---|
| `INTERNAL_ERROR` | 500 | server_error | 미처리 예외 (catch되지 않은 throw) |
| `SERVICE_UNAVAILABLE` | 503 | service_unavailable | 외부 의존성 일시 장애 |
| `RATE_LIMIT_EXCEEDED` | 429 | rate_limit | 호출 빈도 초과 |
| `CONFLICT` | 409 | conflict | 상태 충돌 (중복 생성, 동시 수정) |
| `NOT_FOUND` | 404 | not_found | 도메인별 NotFoundException이 UPPER_SNAKE_CASE message 없이 throw됐을 때 fallback |
| `FORBIDDEN` | 403 | authorization | 일반 권한 거부 fallback (구체적 코드가 없을 때) |
| `UNAUTHENTICATED` | 401 | authentication | 인증 누락 fallback |

`error-response.helper.ts`의 `statusToDefaultCode()`가 throw된 message가 UPPER_SNAKE_CASE 패턴이 아닐 때 status로부터 추론하는 기본 코드들이다.

---

## 코드 명명 규칙

- `UPPER_SNAKE_CASE` (예: `TOKEN_EXPIRED`, `CANNOT_DEMOTE_SELF`)
- 동사보다 **명사·상태형** 사용
  - 좋음: `CANNOT_DEMOTE_SELF`, `USER_NOT_FOUND`, `INSUFFICIENT_ROLE`
  - 피함: `FAILED_TO_DEMOTE`, `USER_LOOKUP_FAILED`
- 도메인 prefix는 충돌할 때만 (`USER_NOT_FOUND` vs `INVITATION_NOT_FOUND`)
- 영문 알파벳 + 숫자 + 밑줄만. 한국어/특수문자 금지

## 새 코드 추가 절차

1. 본 문서의 적절한 도메인 섹션에 행 추가
2. 도메인 service/Guard에서 `throw new XxxException('NEW_CODE')` 형태로 동일 문자열 사용
3. PR 본문에 변경된 행을 인용
4. 코드가 client에 노출되어야 하면 클라이언트 코드(웹/앱) 담당자에게 공유

## 응답 message 규칙

- `error.message`는 기본적으로 `error.code`와 동일(영문 코드 그대로 노출)
- 사용자에게 한국어 메시지가 필요한 경우 클라이언트(웹/앱)에서 code → 메시지 매핑
- 서버는 code/type을 SSOT로 유지, message는 코드 그대로

## 변경 이력

- 2026-05-13: 초안 작성 (Guard 6종 + Admin 부여 정책 기준)
