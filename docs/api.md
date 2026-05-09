# API 설계 문서

> Base URL: `/api/v1`
> 모든 응답은 Envelope 패턴 사용
> - 성공: `{ success: true, data: ... }` / 목록: `meta: { total, page, limit, totalPages }` 추가
> - 에러: `{ success: false, error: { code, message, details? } }`

---

## 목차

1. [Auth](#auth)
2. [Users](#users)
3. [Invitation Templates](#invitation-templates)
4. [Invitations](#invitations)
5. [Event Location](#event-location)
6. [Participants](#participants)
7. [Invitation Send Logs](#invitation-send-logs)
8. [Missions](#missions)
9. [Participant Locations](#participant-locations)
10. [Photos](#photos)
11. [Feedbacks](#feedbacks)
12. [Notifications](#notifications)

---

## Auth

| Method | Path | 설명 | 인증 | 비고 |
|--------|------|------|:----:|------|
| POST | `/auth/login` | 소셜 로그인 | ❌ | provider + code → JWT 발급 |
| POST | `/auth/logout` | 로그아웃 | ✅ | |
| POST | `/auth/refresh` | 토큰 갱신 | ❌ | refresh token |

---

## Users

| Method | Path | 설명 | 인증 | 비고 |
|--------|------|------|:----:|------|
| GET | `/users/me` | 내 프로필 조회 | ✅ | |
| PATCH | `/users/me` | 내 프로필 수정 | ✅ | |
| DELETE | `/users/me` | 회원 탈퇴 | ✅ | soft delete |
| GET | `/users/me/social-accounts` | 연결된 소셜 계정 목록 | ✅ | |
| DELETE | `/users/me/social-accounts/:provider` | 소셜 계정 연결 해제 | ✅ | provider: kakao \| naver \| apple |

---

## Invitation Templates

| Method | Path | 설명 | 인증 | 비고 |
|--------|------|------|:----:|------|
| GET | `/invitation-templates` | 템플릿 목록 | ❌ | isActive=true 필터 |
| GET | `/invitation-templates/:id` | 템플릿 단건 | ❌ | |
| POST | `/invitation-templates` | 템플릿 생성 | ✅ | admin only |
| PATCH | `/invitation-templates/:id` | 템플릿 수정 | ✅ | admin only |
| DELETE | `/invitation-templates/:id` | 템플릿 삭제 | ✅ | admin only |

---

## Invitations

| Method | Path | 설명 | 인증 | 비고 |
|--------|------|------|:----:|------|
| GET | `/invitations` | 내 초대장 목록 | ✅ | userId는 JWT 추출 |
| GET | `/invitations/:id` | 초대장 단건 | ✅ | |
| POST | `/invitations` | 초대장 생성 | ✅ | 생성자는 HOST로 participants 자동 등록 |
| PATCH | `/invitations/:id` | 초대장 수정 | ✅ | HOST만 |
| PATCH | `/invitations/:id/status` | 상태 전이 (active → closed) | ✅ | HOST만 |
| DELETE | `/invitations/:id` | 초대장 삭제 | ✅ | HOST만 |

---

## Event Location

> invitation과 1:1 관계. 등록/수정은 PUT으로 upsert 처리.

| Method | Path | 설명 | 인증 | 비고 |
|--------|------|------|:----:|------|
| GET | `/invitations/:invitationId/event-location` | 행사 장소 조회 | ✅ | |
| PUT | `/invitations/:invitationId/event-location` | 행사 장소 등록/수정 | ✅ | upsert, HOST만 |
| DELETE | `/invitations/:invitationId/event-location` | 행사 장소 삭제 | ✅ | HOST만 |

---

## Participants

| Method | Path | 설명 | 인증 | 비고 |
|--------|------|------|:----:|------|
| GET | `/invitations/:invitationId/participants` | 참가자 목록 | ✅ | |
| POST | `/invitations/:invitationId/participants` | 참가 등록 (RSVP) | ✅ | memberRole: GUEST로 생성 |
| PATCH | `/invitations/:invitationId/participants/:id/rsvp` | RSVP 상태 변경 | ✅ | 본인만. rsvpStatus: attending \| undecided \| absent \| cancelled |
| DELETE | `/invitations/:invitationId/participants/:id` | 참가 취소 | ✅ | 본인 또는 HOST |

---

## Invitation Send Logs

| Method | Path | 설명 | 인증 | 비고 |
|--------|------|------|:----:|------|
| GET | `/invitations/:invitationId/send-logs` | 전송 이력 조회 | ✅ | HOST만 |
| POST | `/invitations/:invitationId/send-logs` | 전송 이력 기록 | ✅ | channel: link \| kakao \| sms \| email \| dm |

---

## Missions

| Method | Path | 설명 | 인증 | 비고 |
|--------|------|------|:----:|------|
| GET | `/invitations/:invitationId/missions` | 미션 목록 | ✅ | |
| GET | `/invitations/:invitationId/missions/:id` | 미션 단건 | ✅ | |
| POST | `/invitations/:invitationId/missions` | 미션 생성 | ✅ | HOST만 |
| DELETE | `/invitations/:invitationId/missions/:id` | 미션 삭제 | ✅ | HOST만 |

---

## Participant Locations

| Method | Path | 설명 | 인증 | 비고 |
|--------|------|------|:----:|------|
| GET | `/invitations/:invitationId/participant-locations` | 참가자 위치 전체 조회 | ✅ | |
| PUT | `/invitations/:invitationId/participant-locations/me` | 내 위치 업데이트 | ✅ | upsert |

---

## Photos

| Method | Path | 설명 | 인증 | 비고 |
|--------|------|------|:----:|------|
| GET | `/invitations/:invitationId/photos` | 사진 목록 | ✅ | deletedAt IS NULL, 페이지네이션 |
| GET | `/invitations/:invitationId/photos/:id` | 사진 단건 | ✅ | viewCount 증가 |
| POST | `/invitations/:invitationId/photos` | 사진 업로드 | ✅ | missionId optional |
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
| PATCH | `/notifications/:id/read` | 알림 읽음 처리 | ✅ | |
| PATCH | `/notifications/read-all` | 전체 읽음 처리 | ✅ | |
| GET | `/notifications/settings` | 알림 설정 조회 | ✅ | |
| PATCH | `/notifications/settings` | 알림 설정 수정 | ✅ | upsert |

---

> **총 53개 엔드포인트**
