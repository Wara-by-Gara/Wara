# Mobile Parity — API 격차 감사 (Phase B)

> web/api 대비 mobile이 필요로 하는 백엔드가 갖춰졌는지 점검. 결론: **API는 web parity로 기능 완성 — 순수 백엔드 신규 작업은 네이티브 푸시뿐**(Phase B에서 구현 완료).

## 1. 엔드포인트 도메인 커버리지

web `apps/web/src/lib/api/*`의 24개 도메인 ↔ API 컨트롤러가 1:1 대응. 누락 도메인 없음.

| web 도메인 | API 컨트롤러 | 상태 |
|---|---|:--:|
| auth | `auth/auth`, `auth/apple` | ✅ |
| users | `users/users` | ✅ |
| invitations | `invitations/invitations` | ✅ |
| participants | `participants/participants` | ✅ |
| locations | `locations/locations`, `locations-search` | ✅ |
| photos | `photos/photos`, `photo-map` | ✅ |
| feedbacks | `feedbacks/feedbacks` | ✅ |
| missions | `missions/missions`, `mission-templates` | ✅ |
| dateVote | `date-vote/date-vote` | ✅ |
| conversations | `conversations/conversations` | ✅ |
| notifications | `notifications/notifications` | ✅ |
| friends | `friends/friends` | ✅ |
| blocklist | `blocklist/blocklist` | ✅ |
| aiGenerations | `ai-generations/ai-generations` | ✅ |
| questionnaire | `questionnaire/questionnaire` | ✅ |
| textBlasts | `text-blasts/text-blasts` | ✅ |
| templates | `templates/templates` | ✅ |
| terms | `terms/terms` | ✅ |
| inquiries | `inquiries/inquiries` | ✅ |
| faq | `faq/faq` | ✅ |
| weather | `weather/weather` | ✅ |
| sendLogs | `send-logs/send-logs` | ✅ |
| (admin) | `admin/dashboard`, `admin/share-analytics`, `admin-inquiries`, `admin-faq`, `admin-terms` | ✅ |
| push | `push/push` (+ Phase B device 엔드포인트) | ✅ |

→ **도메인 수준 격차 없음.** mobile은 web과 동일 API를 소비하며, 빠진 `api/<domain>.ts` 클라이언트는 mobile 쪽 작업(Phase 0)일 뿐 백엔드 추가 불필요.

## 2. 인증 (mobile)

- 소셜 4종 모두 `POST /auth/{provider}/token`(provider token → Bearer accessToken/refreshToken JSON 반환) 존재. iOS=4종, Android=Apple 제외 3종 정책 일치.
- `POST /auth/refresh`(refreshToken → 신규 토큰) 존재. mobile `api/client.ts`가 이미 소비.
- Socket.IO 3 네임스페이스(`/notifications`·`/dm`·`/locations`) Bearer(`handshake.auth.token`) 인증 지원.
- CSRF Origin 체크는 **쿠키 인증에만** 적용 → Bearer 헤더 사용하는 mobile은 면제. 별도 작업 불필요.

## 3. 페이지네이션

- 목록 응답은 **cursor 기반**(`{ items, nextCursor, hasNext }`) — 예: `GET /notifications`(`notifications.service.ts:123`), 대화 메시지 목록.
- envelope `data`에 그대로 담겨 내려오므로 mobile `apiFetch<T>`로 직접 소비 가능. **offset meta(total/page) 전용 helper는 불필요** — 플랜의 `apiFetchWithMeta` TODO는 cursor 응답엔 해당 없음(무한스크롤은 `nextCursor`로 충분).

## 4. 파일 업로드

- presigned URL 방식(`s3.service.ts`) — 클라가 S3로 직접 PUT 후 서버가 매직넘버/크기/중복 검증. mobile(HEIC/HEIF 허용 MIME 포함)에서 동일 흐름 사용 가능. 백엔드 추가 불필요.

## 5. 딥링크 규격 (확정)

푸시 페이로드 `data.url`은 **상대 경로**여야 RN Expo Router·웹 SW가 그대로 라우팅. `buildPushUrl`(`notifications.service.ts:90`)이 전부 상대 경로 반환 — 규격 충족.

| 알림 조건 | `url` | web 라우트 | mobile Expo Router |
|---|---|---|---|
| `conversation` + targetId | `/chats/:id` | `app/chats/[id]` | `app/chats/[id]` (Phase 3 신규) |
| `invitation` + 투표 타입 | `/invitations/:id/vote` | `.../vote` | `app/invitations/[id]/vote` (Phase 1) |
| `invitation` + targetId | `/invitations/:id` | `app/invitations/[id]` | `app/invitations/[id]` ✅ 존재 |
| `feedback` + invitationId | `/invitations/:id?focus=comments` | 동상세 | `app/invitations/[id]` + query |
| `photo`/`mission` + invitationId | `/invitations/:id` | 동상세 | `app/invitations/[id]` ✅ |
| 그 외 | `/notifications` | `app/notifications` | `app/notifications` (Phase 3) |

> mobile 라우트는 일부 미구현(Phase 1/3에서 생성). 푸시 탭 핸들러는 `data.url`을 Expo Router `router.push(url)`로 그대로 전달하면 됨 — 경로 규격이 web과 동일.

## 6. 후속 (이 Phase 범위 밖)

- **Phase 5(클라)**: `expo-notifications` 권한·토큰 발급 → `POST /push/device` 등록(앱 실행/로그인/토큰 갱신 시 재동기화), 푸시 탭 딥링크.
- **receipt 폴링**: 일부 만료 에러(DeviceNotRegistered)는 ticket이 아닌 receipt에서 지연 확인됨. `getPushNotificationReceiptsAsync` + `lastSeenAt` 기반 주기 정리 job은 후속 개선(현재는 ticket-level 에러로 즉시 정리).
