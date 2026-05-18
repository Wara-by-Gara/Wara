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
| GET | `/invitations/:invitationId/participants` | 참가자 목록 | ✅ | |
| POST | `/invitations/:invitationId/participants` | 참가 등록 (RSVP) | ✅ | |
| PATCH | `/invitations/:invitationId/participants/:id/rsvp` | RSVP 상태 변경 | ✅ | 본인만. rsvpStatus: attending \| undecided \| absent \| cancelled |
| DELETE | `/invitations/:invitationId/participants/:id` | 참가 취소 | ✅ | 본인 또는 HOST |

---

## Invitation Send Logs

| Method | Path | 설명 | 인증 | 비고 |
|--------|------|------|:----:|------|
| GET | `/invitations/:invitationId/logs` | 전송 이력 조회 | ✅ | HOST만 |
| POST | `/invitations/:invitationId/logs` | 전송 이력 기록 | ✅ | channel: link \| kakao \| sms \| email \| dm |

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

> **총 57개 엔드포인트**
