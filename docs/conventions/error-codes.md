# 에러 코드 목록

> 에러 응답 형식 (HTTP status는 응답 헤더로 전달, body 안에는 없음)
> ```json
> {
>   "success": false,
>   "error": {
>     "code": "AUTH_INVALID_STATE",
>     "type": "authentication",
>     "message": "AUTH_INVALID_STATE",
>     "details": { }
>   },
>   "meta": {
>     "requestId": "uuid-v4",
>     "timestamp": "2026-05-14T12:34:56.789Z"
>   }
> }
> ```
> - `code`: 도메인 에러 코드 (이 문서 표 기준)
> - `type`: status 그룹 (invalid_request / authentication / authorization / not_found / conflict / rate_limit / service_unavailable / server_error)
> - `message`: 사람이 읽는 메시지 (현재 `code`와 동일하게 반환됨)
> - `details`: 검증 실패 등 부가 정보 (optional)
> - `meta.requestId`: `x-request-id` 헤더 echo 또는 새 UUID

---

## Auth

| 코드 | 상태코드 | 상황 |
|------|:--------:|------|
| `AUTH_INVALID_STATE` | 401 | state 위조 또는 만료 |
| `AUTH_INVALID_TOKEN` | 401 | id_token 위조 또는 만료 |
| `AUTH_USER_NOT_FOUND` | 401 | 유저 조회 실패 |
| `TOKEN_EXPIRED` | 401 | refresh token 만료 |
| `TOKEN_INVALID` | 401 | refresh token 위조 또는 없음 |
| `APPLE_SERVER_TIMEOUT` | 504 | Apple 인증 서버 응답 시간 초과 |

## Invitation

| 코드 | 상태코드 | 상황 |
|------|:--------:|------|
| `INVITATION_ACCESS_REVOKED` | 403 | HOST에 의해 차단된 사용자가 초대장에 접근 |
| `INVITATION_ID_REQUIRED` | 400 | BlocklistGuard가 적용된 라우트에 invitationId 파라미터 없음 |

## Participants

| 코드 | 상태코드 | 상황 |
|------|:--------:|------|
| `PARTICIPANT_NOT_FOUND` | 404 | 참가자 조회 실패 |
| `PARTICIPANT_ALREADY_EXISTS` | 409 | 이미 참가한 초대장에 재참가 시도 |
| `HOST_CANNOT_LEAVE` | 400 | HOST 본인 탈퇴 시도 |
| `INVITATION_CLOSED` | 422 | 마감된 초대장 참가/RSVP 변경 시도 |
| `RSVP_PERMISSION_DENIED` | 403 | absent 상태 열람 시도 또는 HOST RSVP 변경 시도 |

## Notification

| 코드 | 상태코드 | 상황 |
|------|:--------:|------|
| `NOTIFICATION_NOT_FOUND` | 404 | 알림 없음 |
| `NOTIFICATION_FORBIDDEN` | 403 | 타인의 알림에 접근 |

## Common

| 코드 | 상태코드 | 상황 |
|------|:--------:|------|
| `DB_TRANSACTION_FAILED` | 500 | DB 트랜잭션 실패 |
| `INVITATION_NOT_FOUND` | 404 | 초대장 없음 또는 접근 권한 없음 |
| `PARTICIPANT_NOT_FOUND` | 403 | 해당 초대장의 참가자가 아님 |
| `VALIDATION_ERROR` | 400 | DTO 스키마 검증 실패 (details에 필드별 오류 트리) |
| `INVALID_ULID` | 400 | path param이 유효한 ULID 형식 아님 (details.value) |
| `INVITATION_ID_REQUIRED` | 400 | HOST 가드 라우트에 invitationId path param 누락 |
| `INSUFFICIENT_ROLE` | 403 | 라우트에 필요한 멤버 role 미충족 (예: HOST 전용에 GUEST 접근) |

## Missions

| 코드 | 상태코드 | 상황 |
|------|:--------:|------|
| `MISSION_NOT_FOUND` | 404 | 미션 없음 또는 해당 초대장에 속하지 않음 |
| `MISSION_NOT_ENABLED` | 400 | 초대장의 미션 기능이 비활성화 상태 |


## Photo

| 코드 | 상태코드 | 상황 |
|------|:--------:|------|
| `PHOTO_NOT_FOUND` | 404 | 사진 조회 실패 |
| `PHOTO_FORBIDDEN` | 403 | 본인 사진이 아님 |
| `PHOTO_LIKE_ALREADY_EXISTS` | 409 | 이미 좋아요한 사진 |
| `PHOTO_LIKE_NOT_FOUND` | 404 | 좋아요 없는데 취소 시도 |
| `PARTICIPANT_NOT_FOUND` | 404 | 참여자 조회 실패 |

## Admin

| 코드 | 상태코드 | 상황 |
|------|:--------:|------|
| `ANALYTICS_PERIOD_TOO_LONG` | 400 | 분석 기간이 366일 초과 (admin/analytics/shares/*) |

---

## 규칙

- 새 기능 구현 시 발생하는 에러는 반드시 `error-codes.ts`에 추가 후 사용
- 에러 메시지 문자열 직접 사용 금지

## 새 에러 코드 추가 방법

1. `apps/api/src/common/constants/error-codes.ts`에 상수 추가
2. 이 문서에 항목 추가
3. 서비스에서 `ErrorCode.XXX` 형태로 사용
