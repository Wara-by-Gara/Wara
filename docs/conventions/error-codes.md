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
| `AUTH_PROVIDER_TOKEN_INVALID` | 401 | 소셜 provider 토큰(access token / id_token) 검증 실패 또는 만료 |
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

## Social Link

| 코드 | 상태코드 | 상황 |
|------|:--------:|------|
| `SOCIAL_ALREADY_LINKED` | 409 | 다른 wara 계정에 이미 연결된 소셜로 link 시도. 응답 `details.mergeToken`으로 merge 흐름 제공 |
| `MERGE_TOKEN_INVALID` | 401 | merge token 위조/만료 또는 현재 로그인 user와 mergeToken의 targetUserId 불일치 |
| `USER_SOCIAL_LAST_LINKED` | 400 | 마지막 소셜 계정 해제 시도 (계정 lockout 방지) |
| `SUSPICIOUS_REFRESH` | 401 | 이미 revoke된 refresh token 재사용 감지. 해당 user의 모든 활성 토큰 무효화 후 응답 |
| `CSRF_INVALID_ORIGIN` | 403 | 쿠키 인증 요청의 Origin/Referer가 FRONTEND_URL과 불일치 (CSRF 방어) |
| `USER_HAS_HOSTED_INVITATIONS` | 400 | 호스트로 진행 중인(active) 초대장이 있어 탈퇴 불가. 호스트 권한 이전 후 재시도 |

## Participants

| 코드 | 상태코드 | 상황 |
|------|:--------:|------|
| `PARTICIPANT_NOT_FOUND` | 404 | 참가자 조회 실패 |
| `PARTICIPANT_ALREADY_EXISTS` | 409 | 이미 참가한 초대장에 재참가 시도 |
| `HOST_CANNOT_LEAVE` | 400 | HOST 본인 탈퇴 시도 |
| `PARTICIPANT_ALREADY_HOST` | 400 | 이미 HOST인 참가자에게 호스트 권한 위임 시도 |
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
| `IDEMPOTENCY_IN_PROGRESS` | 409 | 같은 `Idempotency-Key`로 보낸 직전 요청이 아직 처리 중. 클라이언트는 잠시 후 재시도 |

## Missions

| 코드 | 상태코드 | 상황 |
|------|:--------:|------|
| `MISSION_NOT_FOUND` | 404 | 미션 없음 또는 해당 초대장에 속하지 않음 |
| `MISSION_NOT_ENABLED` | 400 | 초대장의 미션 기능이 비활성화 상태 |
| `MISSION_TEMPLATE_NOT_FOUND` | 404 | 미션 템플릿 없음 또는 비활성화 |
| `MISSION_NO_MISSIONS_TO_ASSIGN` | 400 | 배정할 미션이 0개 (호스트가 미션 등록 후 배정 가능) |
| `MISSION_NO_PARTICIPANTS_TO_ASSIGN` | 400 | 배정 대상 참가자 없음 (참석 확정 게스트 0명) |
| `MISSION_NOT_ASSIGNED` | 404 | 본인에게 배정된 미션이 없음 (GET /missions/me) |


## Photo

| 코드 | 상태코드 | 상황 |
|------|:--------:|------|
| `PHOTO_NOT_FOUND` | 404 | 사진 조회 실패 |
| `PHOTO_FORBIDDEN` | 403 | 본인 사진이 아님 |
| `PHOTO_LIKE_ALREADY_EXISTS` | 409 | 이미 좋아요한 사진 |
| `PHOTO_LIKE_NOT_FOUND` | 404 | 좋아요 없는데 취소 시도 |
| `PHOTO_INVALID_MIME` | 400 | 매직넘버 sniff 결과 허용 MIME(jpeg/png/webp/heic/heif) 아님. S3 객체는 즉시 삭제됨 |
| `PHOTO_TOO_LARGE` | 413 | 업로드 크기 10MB 초과. S3 객체는 즉시 삭제됨 |
| `PHOTO_DUPLICATE` | 409 | 동일 초대장에 이미 업로드된 사진 (takenAt+기기+GPS+파일크기 조합 일치) |
| `PARTICIPANT_NOT_FOUND` | 404 | 참여자 조회 실패 |

## Friends

| 코드 | 상태코드 | 상황 |
|------|:--------:|------|
| `FRIEND_NOT_FOUND` | 404 | 친구 관계 없음 또는 상대 유저 없음 |

## Inquiries

| 코드 | 상태코드 | 상황 |
|------|:--------:|------|
| `INQUIRY_NOT_FOUND` | 404 | 문의 없음 또는 접근 권한 없음 |
| `INQUIRY_FORBIDDEN` | 403 | 본인 문의가 아닌 자원에 수정/삭제 시도 |
| `INQUIRY_NOT_EDITABLE` | 409 | pending이 아닌 상태(answering/answered)의 문의 수정 시도 |

## Admin

| 코드 | 상태코드 | 상황 |
|------|:--------:|------|
| `ANALYTICS_PERIOD_TOO_LONG` | 400 | 분석 기간이 366일 초과 (admin/analytics/shares/*) |

## DateVote

| 코드 | 상태코드 | 상황 |
|------|:--------:|------|
| `VOTE_POLL_NOT_FOUND` | 404 | 투표 없음 |
| `VOTE_POLL_ALREADY_EXISTS` | 409 | 초대장에 투표 이미 존재 |
| `VOTE_POLL_CLOSED` | 422 | 마감된 투표에 응답/수정 시도, 또는 closed가 아닌 상태에서 날짜 확정 시도 |
| `VOTE_SLOT_NOT_FOUND` | 404 | 슬롯 없음 또는 해당 폴에 속하지 않음 |
| `VOTE_SLOT_LIMIT_EXCEEDED` | 422 | 슬롯 30개 초과 |
| `VOTE_SLOT_DUPLICATE` | 422 | 동일 날짜·시간 슬롯 중복 등록 |
| `VOTE_EVENT_DATE_SET` | 422 | eventStartAt이 이미 설정된 초대장에 투표 생성 시도 |

## AI

| 코드 | 상태코드 | 상황 |
|------|:--------:|------|
| `AI_PROCESSING_FAILED` | 500 | OpenAI 이미지 합성 실패 |
| `AI_TIMEOUT` | 504 | OpenAI 응답 시간 초과 (60초) |
| `AI_TEMPLATE_NOT_FOUND` | 404 | 초대장에 템플릿이 없어 AI 합성 불가 |
| `AI_DAILY_LIMIT_EXCEEDED` | 429 | 유저당 하루 AI 생성 횟수(3회) 초과 |
| `AI_SERVICE_UNAVAILABLE` | 503 | 사용량 급증으로 서킷 브레이커 동작 중 |

## DM (1:1 채팅)

| 코드 | 상태코드 | 상황 |
|------|:--------:|------|
| `CONVERSATION_NOT_FOUND` | 404 | 대화방 없음 |
| `CONVERSATION_FORBIDDEN` | 403 | 내가 참여한 대화방이 아님 |
| `MESSAGE_NOT_FOUND` | 404 | 메시지 없음 또는 해당 대화방 소속 아님 |
| `MESSAGE_FORBIDDEN` | 403 | 본인이 보낸 메시지가 아님 (삭제 시도) |
| `CANNOT_MESSAGE_SELF` | 400 | 자기 자신과 대화 생성 시도 |
| `GROUP_MEMBER_LIMIT_EXCEEDED` | 400 | 단톡방 최대 인원(30명) 초과 초대 |
| `GROUP_NO_VALID_INVITEES` | 400 | 초대 대상이 모두 기존 멤버이거나 존재하지 않음 |
| `MESSAGE_IMAGE_INVALID` | 400 | imageKey가 대화방 prefix 불일치 또는 미업로드(존재하지 않는 객체) |

## Terms

| 코드 | 상태코드 | 상황 |
|------|:--------:|------|
| `TERMS_AGREEMENT_REQUIRED` | 403 | 필수 약관 미동의 상태로 API 접근 |
| `TERM_NOT_FOUND` | 404 | 약관 없음 |
| `TERM_AGREEMENT_ALREADY_EXISTS` | 409 | 이미 동의한 버전에 재동의 시도 |


---

## 규칙

- 새 기능 구현 시 발생하는 에러는 반드시 `error-codes.ts`에 추가 후 사용
- 에러 메시지 문자열 직접 사용 금지

## 새 에러 코드 추가 방법

1. `apps/api/src/common/constants/error-codes.ts`에 상수 추가
2. 이 문서에 항목 추가
3. 서비스에서 `ErrorCode.XXX` 형태로 사용
