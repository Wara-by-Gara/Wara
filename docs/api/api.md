# API 설계 문서

> Base URL: `/api/v1`
> 모든 응답은 Envelope 패턴 사용
> - 성공: `{ success: true, data: ... }` / 목록: `meta: { total, page, limit, totalPages }` 추가
> - 에러: `{ success: false, error: { code, message, details? } }`

---

## 목차

- [API 설계 문서](#api-설계-문서)
  - [목차](#목차)
  - [Auth](#auth)
  - [Users](#users)
  - [Invitation Templates](#invitation-templates)
  - [Invitations](#invitations)
  - [Event Location](#event-location)
  - [Participants](#participants)
  - [Invitation Send Logs](#invitation-send-logs)
  - [Missions](#missions)
  - [Participant Locations](#participant-locations)
  - [Photos](#photos)
  - [Feedbacks](#feedbacks)
  - [Notifications](#notifications)
  - [Inquiries](#inquiries)
  - [Admin Inquiries](#admin-inquiries)
  - [Admin — Share Analytics](#admin--share-analytics)

---

## Auth

| Method | Path | 설명 | 인증 | 비고 |
|--------|------|------|:----:|------|
| GET | `/auth/{provider}` | Kakao, Naver 로그인 redirect | ❌ | state 생성 → Redis 저장 → Kakao로 302 |
| GET | `/auth/{provider}/callback` | Kakao, Naver OAuth callback | ❌ | code + state 검증 → JWT 발급 → 프론트로 302 |
| POST | `/auth/apple/callback` | Apple OAuth callback | ❌ | Apple이 form-data로 POST. id_token + code + user(최초 1회만) |
| POST | `/auth/logout` | 로그아웃 | ✅ | refresh token 무효화 |
| POST | `/auth/refresh` | 토큰 갱신 | ❌ | refresh token → 새 access token |

---

## Users

| Method | Path | 설명 | 인증 | 비고 |
|--------|------|------|:----:|------|
| GET | `/users/:id` | 다른 사용자 프로필 조회 | ✅ | id, nickname, profileImageUrl, name만 반환 |
| GET | `/users/me` | 내 프로필 조회 | ✅ | |
| PATCH | `/users/me` | 내 프로필 수정 | ✅ | |
| DELETE | `/users/me` | 회원 탈퇴 | ✅ | soft delete |
| GET | `/users/me/socials` | 연결된 소셜 계정 목록 | ✅ | |
| DELETE | `/users/me/socials/:provider` | 소셜 계정 연결 해제 | ✅ | provider: kakao \| naver \| apple |
| POST | `/users/me/socials/:provider/link/url` | 추가 소셜 연결용 OAuth URL 발급 | ✅ | Web flow. state에 userId 인코딩. callback은 `/auth/:provider/callback`이 link state로 분기 처리 |
| POST | `/users/me/socials/:provider/link/token` | 추가 소셜 연결 (providerToken) | ✅ | Mobile flow. body: `{ providerToken }`. 응답: `{ provider }` |
| POST | `/users/me/merge` | 분리된 다른 wara 계정과 통합 | ✅ | body: `{ mergeToken }`. SOCIAL_ALREADY_LINKED 시 발급된 token으로 source user 데이터 전체를 현재 user로 이전 후 source soft delete |

---

## Invitation Templates

| Method | Path | 설명 | 인증 | 비고 |
|--------|------|------|:----:|------|
| GET | `/invitation/templates` | 템플릿 목록 | ❌ | isActive=true 필터 |
| GET | `/invitation/templates/:id` | 템플릿 상세 | ❌ | |
| POST | `/invitation/templates` | 템플릿 생성 | ✅ | admin only |
| PATCH | `/invitation/templates/:id` | 템플릿 수정 | ✅ | admin only |
| DELETE | `/invitation/templates/:id` | 템플릿 삭제 | ✅ | admin only |

---

## Invitations

| Method | Path | 설명 | 인증 | 비고 |
|--------|------|------|:----:|------|
| GET | `/invitations` | 내 초대장 목록 | ✅ | userId는 JWT 추출 |
| GET | `/invitations/:id` | 초대장 상세 | ❌ | 비로그인 접근 가능. RSVP는 별도 인증 필요 |
| POST | `/invitations` | 초대장 생성 | ✅ | 생성자는 HOST로 participants 자동 등록 |
| PATCH | `/invitations/:id` | 초대장 수정 | ✅ | HOST만 |
| DELETE | `/invitations/:id` | 초대장 삭제 | ✅ | HOST만 |

---

## Event Location

> invitation과 1:1 관계. 등록/수정은 PUT으로 upsert 처리.

| Method | Path | 설명 | 인증 | 비고 |
|--------|------|------|:----:|------|
| GET | `/invitations/:invitationId/location` | 행사 장소 조회 | ✅ | |
| PUT | `/invitations/:invitationId/location` | 행사 장소 등록/수정 | ✅ | upsert, HOST만 |
| DELETE | `/invitations/:invitationId/location` | 행사 장소 삭제 | ✅ | HOST만 |

---

## Participants

| Method | Path | 설명 | 인증 | 비고 |
|--------|------|------|:----:|------|
| GET | `/invitations/:invitationId/participants` | 참가자 목록 + summary | ✅ | `?rsvpStatus` 필터 가능. 기본: attending/undecided만. absent는 필터 지정 시 조회 가능 |
| GET | `/invitations/:invitationId/participants/:participantId/profile` | 참가자 프로필 상세 | ✅ | attending/undecided만 조회 가능 |
| GET | `/invitations/:invitationId/participants/:participantId/mutual` | 함께 아는 사람 | ✅ | attending/undecided만 조회 가능 |
| GET | `/invitations/:invitationId/participants/:participantId/shared-invitations` | 함께 참여한 다른 모임 | ✅ | attending/undecided만 조회 가능 |
| POST | `/invitations/:invitationId/participants` | 참가 등록 | ✅ | rsvpStatus 필수. attending/undecided/absent 중 택 1. closed 초대장 불가 |
| PATCH | `/invitations/:invitationId/participants/:participantId/rsvp` | RSVP 상태 변경 | ✅ | 본인만. HOST 불가. rsvpStatus: attending \| undecided \| absent. closed 초대장 불가 |
| PATCH | `/invitations/:invitationId/participants/me/hidden` | 내 초대장 목록 숨김 토글 | ✅ | 본인만 |
| DELETE | `/invitations/:invitationId/participants/:participantId` | 탈퇴 / 강제 퇴장 | ✅ | 본인 또는 HOST. HOST 본인 탈퇴 불가 |

---

## Invitation Send Logs

| Method | Path | 설명 | 인증 | 비고 |
|--------|------|------|:----:|------|
| ~~GET~~ | ~~`/invitations/:invitationId/logs`~~ | ~~전송 이력 조회~~ | — | V1.0 제외. 팀 논의 후 추가 |
| POST | `/invitations/:invitationId/logs` | 공유 로그 기록 | ✅ | HOST·GUEST 가능. channel: link \| kakao \| sms \| email \| dm. kakao는 body에 kakaoMeta 포함 |
| PATCH | `/invitations/:invitationId/logs/:logId/open` | 링크 방문 이벤트 기록 | ❌ | 비로그인 가능. 204 No Content |

### POST `/invitations/:invitationId/logs` 응답

```json
// 공통
{ "inviteUrl": "https://wara.com/rsvp/{id}?ref={logId}" }

// kakao 추가
{ "inviteUrl": "...", "kakaoMeta": { "title": "", "description": "", "imageUrl": "" } }

// sms 추가
{ "inviteUrl": "...", "smsUri": "sms:?body=..." }
```

---

## Missions

| Method | Path | 설명 | 인증 | 비고 |
|--------|------|------|:----:|------|
| GET | `/missions/templates` | 공용 미션 카탈로그 조회 | ✅ | 인증된 모든 유저. 호스트가 모임에 추가할 샘플 |
| GET | `/invitations/:invitationId/missions` | 미션 목록 | ✅ | 모임 참가자만 (멤버십 검증) |
| GET | `/invitations/:invitationId/missions/me` | 본인에게 배정된 미션 조회 | ✅ | 참석 확정(GUEST) 본인. 미배정 시 404 |
| POST | `/invitations/:invitationId/missions` | 미션 생성 | ✅ | HOST만. body `{content}` 또는 `{templateId}` 중 하나 필수 |
| POST | `/invitations/:invitationId/missions/assign` | 미션 랜덤 배정 트리거 | ✅ | HOST만. 참석 확정 GUEST에게 Fisher-Yates 셔플로 랜덤 균등 배정. 재호출 시 재배정 |
| PATCH | `/invitations/:invitationId/missions/:id` | 미션 수정 | ✅ | HOST만. content 수정 |
| DELETE | `/invitations/:invitationId/missions/:id` | 미션 삭제 | ✅ | HOST만 |

---

## Participant Locations

| Method | Path | 설명 | 인증 | 비고 |
|--------|------|------|:----:|------|
| GET | `/invitations/:invitationId/participant/locations` | 참가자 위치 전체 조회 | ✅ | |
| PUT | `/invitations/:invitationId/participant/me/location` | 내 위치 업데이트 | ✅ | upsert |

---

## Photos

| Method | Path | 설명 | 인증 | 비고 |
|--------|------|------|:----:|------|
| POST | `/photos/presigned-url` | S3 업로드용 presigned URL 발급 | ✅ | body: { contentType }. 반환: { presignedUrl, key } |
| GET | `/invitations/:invitationId/photos` | 사진 목록 | ✅ | deletedAt IS NULL, 페이지네이션 |
| GET | `/invitations/:invitationId/photos/:id` | 사진 상세 | ✅ | viewCount 증가 |
| POST | `/invitations/:invitationId/photos` | 사진 등록 | ✅ | S3 업로드 완료 후 key 등록. body: { key } |
| DELETE | `/invitations/:invitationId/photos/:id` | 사진 삭제 | ✅ | soft delete, 본인만 |
| POST | `/invitations/:invitationId/photos/:photoId/likes` | 사진 좋아요 | ✅ | 중복 시 409 |
| DELETE | `/invitations/:invitationId/photos/:photoId/likes` | 사진 좋아요 취소 | ✅ | |

---

## Feedbacks

> 피드백은 초대장 또는 사진에 귀속됨. 3단계 중첩을 피해 사진 피드백은 별도 경로 사용.
> 대댓글은 `parentId` 쿼리 파라미터로 조회.

| Method | Path | 설명 | 인증 | 비고 |
|--------|------|------|:----:|------|
| GET | `/invitations/:invitationId/feedbacks` | 초대장 피드백 목록 | ✅ | `?parentId` 로 대댓글 조회 |
| POST | `/invitations/:invitationId/feedbacks` | 초대장 피드백 작성 | ✅ | `parentId` optional (대댓글) |
| GET | `/photos/:photoId/feedbacks` | 사진 피드백 목록 | ✅ | `?parentId` 로 대댓글 조회 |
| POST | `/photos/:photoId/feedbacks` | 사진 피드백 작성 | ✅ | `parentId` optional (대댓글) |
| PATCH | `/feedbacks/:id` | 피드백 수정 | ✅ | 본인만 |
| DELETE | `/feedbacks/:id` | 피드백 삭제 | ✅ | soft delete, 본인만 |
| POST | `/feedbacks/:feedbackId/likes` | 피드백 좋아요 | ✅ | 중복 시 409 |
| DELETE | `/feedbacks/:feedbackId/likes` | 피드백 좋아요 취소 | ✅ | |

---

## Notifications

| Method | Path | 설명 | 인증 | 비고 |
|--------|------|------|:----:|------|
| GET | `/notifications` | 알림 목록 | ✅ | 페이지네이션, userId JWT 추출 |
| GET | `/notifications/unread` |  읽지 않는 알림 | ✅ | 카운트용 🔴 |
| PATCH | `/notifications/:id/read` | 알림 읽음 처리 | ✅ | |
| PATCH | `/notifications/readAll` | 전체 읽음 처리 | ✅ | |
| GET | `/notifications/settings` | 알림 설정 조회 | ✅ | |
| PATCH | `/notifications/settings` | 알림 설정 수정 | ✅ | upsert |

---

## Push

> 백그라운드/앱 닫힘 상태 푸시. 웹은 Web Push(VAPID), 모바일은 Expo Push.
> 알림 발생 시 서버가 두 채널로 병행 발송(best-effort). 페이로드 `data.url`은 **상대 경로**(예: `/chats/:id`, `/invitations/:id`, `/notifications`) — RN Expo Router·웹 SW가 그대로 라우팅.

| Method | Path | 설명 | 인증 | 비고 |
|--------|------|------|:----:|------|
| GET | `/push/vapid-public-key` | Web Push 공개키 | ✅ | 브라우저 구독용 |
| POST | `/push/subscriptions` | Web Push 구독 등록 | ✅ | 브라우저 PushSubscription. endpoint upsert |
| DELETE | `/push/subscriptions` | Web Push 구독 해제 | ✅ | body: { endpoint } |
| POST | `/push/device` | Expo 기기 토큰 등록 | ✅ | body: { token, platform: ios\|android, deviceId?, deviceName?, appVersion? }. token upsert |
| DELETE | `/push/device` | Expo 기기 토큰 해제 | ✅ | body: { token }. soft delete |

> 모바일 등록 시점: 앱 실행(권한 보유) / 로그인 성공 직후 / Expo 토큰 갱신 시 `POST /push/device` 재동기화. 로그아웃 시 `DELETE /push/device`.

---

## Inquiries

> 사용자가 서비스 이용 중 문제를 보고하는 기능. 답변 받기 전(pending)에만 수정/삭제 가능.

| Method | Path | 설명 | 인증 | 비고 |
|--------|------|------|:----:|------|
| POST | `/inquiries` | 문의 생성 | ✅ | inquiryType: invitation \| photo \| notification \| mission \| account \| general |
| GET | `/inquiries/me` | 내 문의 목록 | ✅ | 최신순 정렬, soft delete 제외 |
| GET | `/inquiries/:id` | 문의 상세 | ✅ | 본인만 조회 가능 |
| PATCH | `/inquiries/:id` | 문의 수정 | ✅ | pending 상태일 때만. title, content 수정 가능 |
| DELETE | `/inquiries/:id` | 문의 삭제 | ✅ | soft delete, 본인만 |

---

## Admin Inquiries

> 관리자 전용. 사용자의 모든 문의를 조회하고 답변을 등록/수정.

| Method | Path | 설명 | 인증 | 비고 |
|--------|------|------|:----:|------|
| GET | `/admin/inquiries` | 전체 문의 목록 | ✅ admin | 최신순 정렬 |
| GET | `/admin/inquiries/:id` | 문의 상세 | ✅ admin | |
| PATCH | `/admin/inquiries/:id/answer` | 답변 등록/수정 | ✅ admin | body: { answer, status: 'in_progress' \| 'resolved' } |

---

## Admin — Share Analytics

> 관리자 전용. 공유 로그(`invitation_send_logs`)와 링크 이벤트(`invitation_link_events`)를 집계한 분석 endpoint.
> 공통 쿼리: `?from=ISO8601&to=ISO8601` — 둘 다 생략 시 최근 30일. **기간은 최대 366일**(초과 시 400 `ANALYTICS_PERIOD_TOO_LONG`).
> 시간대별 통계는 **KST(Asia/Seoul)** 기준. 모든 비율은 0~1 소수(소수점 4자리).

| Method | Path | 설명 | 인증 | 응답 핵심 |
|--------|------|------|:----:|----------|
| GET | `/admin/analytics/shares/channels` | 채널별 공유 효과 | ✅ admin | `byChannel: [{channel, sends, opens, joins, openRate, joinRate}]` + `totalSends` |
| GET | `/admin/analytics/shares/conversion` | 공유 → 방문 → 로그인 → 참가 전환 깔때기 | ✅ admin | `funnel: {sent, opened, openedAuthed, joined}` + `rates: {openRate, authedOpenRate, joinRate, overallConversion}` |
| GET | `/admin/analytics/shares/viral` | GUEST 바이럴 기여 비율 | ✅ admin | `hostSends`, `guestSends`, `unattributedSends`, `guestViralRatio` (= guestSends / (hostSends + guestSends)) |
| GET | `/admin/analytics/shares/timeline` | 시간대(0~23시 KST)별 오픈 분포 | ✅ admin | `byHour: 24개 (빈 시간 0)` + `totalOpens` |

**용어**
- `sends` = 발송 횟수 (`invitation_send_logs` row)
- `opens` = 발송된 링크에 대한 distinct opened 이벤트 수
- `openedAuthed` = opened 중 user_id 있는(로그인 상태) distinct log
- `joined` = 발송된 링크에 대한 distinct joined 이벤트 수
- `unattributedSends` = 발송자가 해당 모임의 participants 매핑이 없는 경우 (탈퇴 등, viral 분모에서 제외)
- conversion의 모든 카운트는 `send_logs.createdAt`이 기간 안에 들어오는 발송에 대해서만 집계 (openRate ≤ 1 보장)

---

> **총 69개 엔드포인트**
