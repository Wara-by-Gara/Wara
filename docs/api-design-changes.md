# API 설계 변경 사항 요약

> `feature/api-design` 브랜치에서 진행된 API 설계 및 문서화 작업 내역입니다.

---

## 1. Auth — 소셜 로그인 방식 변경

### 변경 전
```
POST /auth/login   { provider, code } → JWT 발급
```
클라이언트(앱)가 OAuth 흐름을 처리하고 코드를 서버에 전달하는 **모바일 패턴**이었습니다.

### 변경 후 (웹 SPA 기준 서버 사이드 OAuth)
| Method | Path | 설명 |
|--------|------|------|
| GET | `/auth/{provider}` | Kakao / Naver 로그인 페이지로 302 redirect |
| GET | `/auth/{provider}/callback` | code + state 검증 → JWT 발급 → 프론트로 302 |
| POST | `/auth/apple/callback` | Apple은 콜백이 **POST** (form-data). 최초 1회만 name/email 수신 |

**포인트**
- `state` 파라미터로 CSRF 방어 (Redis에 TTL 저장 후 callback 시 검증)
- Apple은 GET이 아닌 **POST** callback이므로 별도 처리 필요
- Apple은 최초 로그인 1회만 `user` 정보(name, email)를 전송 → 반드시 저장

---

## 2. Users — 타인 프로필 조회 추가

| Method | Path | 설명 |
|--------|------|------|
| GET | `/users/:id` | 공개 정보만 반환: `id`, `nickname`, `profileImageUrl`, `name` |

이메일, 생년, 성별 등 민감 정보는 본인(`/users/me`) 조회에서만 노출됩니다.

### 경로 변경
- `/users/me/social-accounts` → `/users/me/socials`
- `/users/me/social-accounts/:provider` → `/users/me/socials/:provider`

---

## 3. Invitation Templates — 경로 변경

| 변경 전 | 변경 후 |
|---------|---------|
| `/invitation-templates` | `/invitation/templates` |
| `/invitation-templates/:id` | `/invitation/templates/:id` |

---

## 4. Invitations — 공유 링크 대응

### `GET /invitations/:id` 공개화 (❌ 인증 불필요)
초대장 링크를 공유받은 비로그인 사용자도 초대장을 볼 수 있도록 변경.  
RSVP(`POST /invitations/:invitationId/participants`)는 여전히 인증 필요.

### `PATCH /invitations/:id/status` 제거
상태 전이는 `PATCH /invitations/:id` 본문에서 처리합니다.

---

## 5. 경로 단순화

| 섹션 | 변경 전 | 변경 후 |
|------|---------|---------|
| Event Location | `/invitations/:id/event-location` | `/invitations/:id/location` |
| Send Logs | `/invitations/:id/send-logs` | `/invitations/:id/logs` |
| Participant Locations | `/invitations/:id/participant-locations` | `/invitations/:id/participant/locations` |
| 내 위치 업데이트 | `/invitations/:id/participant-locations/me` | `/invitations/:id/participant/me/location` |

---

## 6. Missions — 수정 API 추가

| Method | Path | 설명 |
|--------|------|------|
| PATCH | `/invitations/:invitationId/missions/:id` | 미션 content 수정 (HOST만) |

DB 스키마에 `updatedAt` 컬럼 추가 (`apps/api/drizzle/schema/missions.ts`).

---

## 7. Photos — S3 presigned URL 분리

### 변경 전 (서버 경유 업로드)
```
POST /invitations/:invitationId/photos   파일 직접 전송
```

### 변경 후 (S3 직접 업로드)
```
① POST /photos/presigned-url            { contentType } → { presignedUrl, key }
② 클라이언트가 presignedUrl로 S3에 직접 PUT
③ POST /invitations/:invitationId/photos { imageKey }    → DB 등록
```

### DB 스키마 변경 (`apps/api/drizzle/schema/photos.ts`)
- `missionId` 컬럼 제거 (미션-사진 연결 기능 미사용)

---

## 8. Notifications — 읽지 않은 알림 수 조회 추가

| Method | Path | 설명 |
|--------|------|------|
| GET | `/notifications/unread` | 읽지 않은 알림 수 반환 `{ count: N }` |

뱃지 표시 등 UI용 카운트 전용 엔드포인트입니다.

---

## 변경 파일 목록

| 파일 | 변경 내용 |
|------|---------|
| `docs/api.md` | API 설계 문서 전면 개정 |
| `docs/swagger.html` | Swagger UI 문서 api.md와 동기화 |
| `apps/api/drizzle/schema/photos.ts` | `missionId` 컬럼 제거 |
| `apps/api/drizzle/schema/missions.ts` | `updatedAt` 컬럼 추가 |
