# WARA Web 통합 안정화 체크리스트 (STEP 0 베이스라인)

> 팀원 각자 머지 후 통합 안정화를 위한 작업 추적 문서. [로드맵 순서](../../README.md) 기준으로 STEP별 진행.
> 각 항목은 정적 진단(코드 근거)으로 확인된 것. 체크하며 진행.

## 베이스라인 (기준 시점)

| 항목 | 상태 |
|---|---|
| `pnpm --filter web typecheck` | ✅ 통과 |
| `pnpm --filter web lint` | ✅ 통과 (Warning: `MainImageEditor` unused directive 1건 — 무관) |
| `pnpm --filter web build` | ✅ 통과 |

**핵심 인사이트: 컴파일/타입/린트는 멀쩡한데 런타임·통합이 깨진 상태.**
→ 따라서 "빌드 통과"는 안전 신호가 아니다. 아래 체크리스트(통합/런타임)가 진짜 회귀 기준.

---

## STEP 1 — 공통 토대 통일 (이중 정의 제거) ★최우선

- [ ] **API 클라이언트 단일화** — `lib/api-client.ts`(미사용) 삭제, `lib/api/client.ts`(401/refresh 처리 포함, 실사용)로 통일. `lib/api/notifications.ts`·`lib/api/weather.ts`가 `api-client.ts`를 참조 중 → `api/client.ts`로 전환
- [ ] **QueryClient 단일화** — `lib/query-client.ts`(60s)·`lib/query-provider.tsx`(30s)·`lib/providers.tsx`(60s)·`providers/index.tsx`(실사용) 4곳 난립. 단일 팩토리로 통일하고 `staleTime`/`gcTime`/`retry` 명시. 미사용 파일 삭제
- [ ] **QueryKeys 단일화** — `constants/queryKeys.ts`로 일원화. `hooks/useNotifications.ts`의 `notificationKeys`, `domain/Home/HomeContainer.tsx`의 `["me"]` 등 분산 키 제거(캐시 무효화 불일치 방지)
- [ ] **env/API URL 정합** — `lib/env.ts`(`API_BASE = ${NEXT_PUBLIC_API_URL}/api`, 포트 3001), CLAUDE.md 문서(3002/api/v1 오기) 일치. dev proxy 여부 결정(STEP 2와 직결)

## STEP 2 — 인증/세션 (로그인 복구) ★블로커

- [x] **쿠키 전달 (FE 처방)** — ✅ `next.config.ts` rewrites(`/api/*` → 백엔드 프록시, afterFiles라 `/api/gifs/*` 자체 route 우선) + `lib/env.ts` `API_BASE`를 상대경로(`/api`)로 변경 → 프론트와 same-origin. `SOCKET_BASE`는 ws라 절대 유지. (API_BASE 사용처 전부 client 확인 완료)
  - ⚠️ **남은 백엔드 협의**: OAuth 콜백 `set-cookie` 도메인 + provider `redirect_uri`를 프론트 경유(`/api/...`)로. 미적용 시 OAuth 직후 쿠키가 백엔드 도메인(3001)에 set되어 프론트(3000)에서 못 읽음. (cookie `domain` 설정 또는 redirect_uri 프록시화)
- [x] **401 상태 동기화** — ✅ `lib/api/client.ts` 401·refresh 실패 시 `authStore.logout()` 호출 추가 (쿠키+zustand 동기화)
- [ ] **OAuth 콜백 타이밍** — `app/layout.tsx`의 `OAuthCallbackHandler`가 `Providers` 밖 → hydrate 경쟁. (proxy로 쿠키 해결 후 재평가) Providers 안으로 이동, `useOAuthCallback`→`login()`→hydrate 순서 정리
- [ ] **세션 게이트 완화** — `app/terms/agree/page.tsx`가 `isLoggedIn`에 의존해 막힘. 쿠키/`useMe` 확정 후 표시
- [ ] **검증(런타임):** dev에서 4종 소셜 로그인 → 홈 진입 → 새로고침 유지 → 로그아웃 끝까지 동작 (proxy 적용 효과 확인)

## STEP 3 — 라우팅·네비게이션·가드

- [x] **FEEDBACKS 끊김 수정** — ✅ `ROUTES.INVITATIONS.FEEDBACKS`(없는 경로) → `COMMENTS`(`/invitations/:id/comments`, 실제 page)로 rename + `NotificationBell`·`NotificationsContainer` 참조 수정
- [x] **VOTE / inquiries 재확인** — ✅ 실제는 정상. VOTE는 route group `(not-header)`라 URL이 ROUTES와 일치, `inquiries/list`·`[id]`도 page 존재 (초기 진단 오판 정정)
- [ ] **EDIT — 기능 자체 미완성 (→ STEP 4)** — `EditContainer`가 자식에 `invitation`을 안 넘겨 스켈레톤만. `HostView`의 EDIT 버튼도 `/invitations/:id/edit` 페이지 없음. 라우트 정합이 아니라 **기능 복구**(id로 invitation fetch→자식 전달 + 페이지 생성) 필요
- [ ] **photo/mission 알림 라우팅 — 타겟 페이지 미구현** — `PHOTO_DETAIL`/`MISSION_DETAIL` 라우트만 있고 실제 page 없음 → 알림 클릭 404. 페이지 구현 또는 fallback(상세) 결정 필요(기획)
- [ ] **인증 가드 middleware — STEP 2(쿠키) 완료 후** — ⚠️ 지금 켜면 `is_logged_in` 쿠키가 아직 프론트(3000)에 안 잡힌 상태라 로그인 유저도 `/login`으로 튕겨 **로그인 악화**. 쿠키(백엔드 협의) 해결 후 활성화. (`/invitations/create`는 비로그인 작성 허용 흐름이라 보호 대상 제외)
- [ ] **빈 페이지/정리 — 충돌 주의** — `admin`은 현재 다른 작업자가 dashboard 구현 중. 미사용 ROUTES(`MISSIONS`/`PHOTOS`/`SETTINGS` 등) 정리는 `routes.ts` 동시 수정과 머지 충돌 위험 → 동시 작업 끝난 뒤
- [ ] **screens/ vs domain/ 정리** — `screens`=Storybook, `domain/*Container`=실제 라우팅 명시(주석)

## STEP 4 — 화면별 상태·데이터·엣지

- [ ] **도메인 순회** — 상세(Guest/Host)·생성·홈/목록·참가자·알림·프로필·공개초대장: 로딩/빈/에러/권한분기 점검
- [ ] **loading/error/empty 일관성** — `isError` 처리 거의 없음. 기존 `components/organisms/Skeleton`·`ErrorState` 실제 연결
- [ ] **hydration/엣지** — `useMe`/`authStore` hydrate 타이밍, 비로그인 `enabled` 가드, `NotificationSocketMount` 마운트 타이밍

## STEP 5 — 전역 안전망 & 마감

- [ ] **에러 바운더리** — `app/error.tsx`/`global-error.tsx` + 필요한 `loading.tsx`. react-query 에러 표준화
- [ ] **hydration 경고 정리** — `app/layout.tsx` `<html>`의 광범위 `suppressHydrationWarning`을 국소(`<time>` 등)로 축소
- [ ] **죽은 코드 제거** — 이중 정의 잔재, 미사용 `ROUTES`/컴포넌트

## STEP 6 — 검증·회귀

- [x] **Playwright E2E 이미 구축됨** — `apps/web/e2e/` 페르소나별 spec 존재
- [x] **CI E2E job 추가** — `.github/workflows/ci.yml`에 `e2e` job (ci 후 실행, postgres·api+web·migrate·seed·playwright)
- [x] **API health endpoint** — `GET /api/health` (@Public) 추가 → CI wait-on 대상
- [x] **wait-on** devDependencies 추가
- [ ] **런타임 검증 (dev 직접)** — 소셜 로그인 시도 → `is_logged_in` 쿠키가 localhost:3000에 잡히는지 → middleware 활성화(`src/middleware.ts` matcher 주석 해제)

---

## 런타임 확인 필요 (dev 직접 — 빌드로 안 잡힘)

> dev 서버 + 브라우저로 직접 밟으며 기록. STEP 2 이후 해소 확인.

- [ ] 카카오/네이버/구글 로그인 → 콜백 후 로그인 상태 유지되는가
- [ ] 로그인 후 새로고침 시 세션 유지되는가
- [ ] 로그인 상태에서 인증 API(`/users/me` 등) 401 없이 응답하는가
- [ ] 보호 페이지(`/profile`, `/invitations/create`) 비로그인 접근 시 처리
- [ ] 주요 네비게이션(하단 탭, 초대장 수정/투표/피드백 진입) 끊김 없는가

---

## E2E 페르소나 패스에서 발견·수정한 API 버그

- [x] **admin 분석 `active-users` 500 (GROUP BY 위반) 수정** — ✅ `apps/api/src/admin/dashboard.repository.ts`의 `activeUsersByBucket`에서 `bucket`(`day`/`week`/`month`)을 바인드 파라미터로 넘겨, 동일 `periodExpr`이 SELECT와 GROUP BY에서 서로 다른 placeholder로 직렬화 → Postgres `column "activity.created_at" must appear in the GROUP BY clause` 오류. enum이 보장되므로 `sql.raw`로 인라인해 양쪽 표현식을 동일화. `GET /api/admin/analytics/active-users` 200 + daily/weekly/monthly 정상 응답 확인.
  - ⚠️ **운영 메모(환경)**: 로컬에서 `pnpm --filter @wara/api dev`(nest start --watch) 워처가 2개 떠 같은 `dist/`에 동시 빌드 → stale dist `MODULE_NOT_FOUND` 크래시 유발. API 워처는 1개만 유지할 것(중복 터미널 정리).

---

## 페르소나 E2E(Playwright) 패스에서 발견·수정 (2026-06-05)

> 인프라: `apps/web/playwright.config.ts` + `apps/web/e2e/`(setup/fixtures/helpers + 페르소나별 spec). 서버 수동 기동 전제(web :3000, api :3001).

### 웹 실제 버그 (수정 완료)
- [x] **공개 초대장 `/i/:id` SSR 크래시** — ✅ `app/i/[invitationId]/page.tsx`가 서버 컴포넌트에서 `getInvitation()`(→ `apiGet`, `API_BASE='/api'` 상대경로)을 호출 → Node `fetch`가 상대 URL 파싱 실패(`Failed to parse URL from /api/...`) → "Application error" 크래시. **수정**: 페이지를 `invitationId`만 넘기는 얇은 진입점으로 바꾸고, `PublicInvitationContainer`가 `useInvitation`(클라이언트 fetch)으로 조회 + loading/error("초대장을 찾을 수 없어요") 처리. 잘못된 ID(400/404)·정상 ID 모두 anon에서 검증.
  - 부수: 항상 실패하던(상대경로) `generateMetadata` 서버 fetch 제거. OG 메타데이터가 필요하면 서버측 절대 URL 도입을 백엔드와 별도 협의(현재 비동작이라 회귀 아님).

### 테스트 하네스 보정 (앱 정상 동작)
- [x] **`/calendar` 비로그인 → `/login` 하드 가드** — `useMyInvitations`가 anon에서도 호출돼 401 → `apiClient`가 강제 로그아웃하며 `window.location.href='/login'` → `page.goto`가 `net::ERR_ABORTED`. 의도된 가드로 판단, `helpers.safeGoto`(클라이언트 리다이렉트 ERR_ABORTED 흡수) 도입 + 리다이렉트 검증 테스트 추가. (`/friends`·`/notifications`는 anon 게이팅돼 진입)
- [x] **`/admin/faq` ERR_ABORTED** — 동일하게 진행 중 네비게이션이 리다이렉트로 취소된 케이스. `smokeVisit`를 `safeGoto` 기반으로 바꿔 흡수, admin 로그인 상태에서 크래시 없음 확인.

### 추가한 엣지케이스 (모두 통과, 신규 앱 버그 없음)
- anon: `/i/:id` 잘못된 ID 친화 에러, 정상 ID 응답 폼 노출, 비로그인 응답 시 `/login` 유도 + RSVP 폼/`returnUrl` 보존.
- guest: 문의 빈 제출 no-op(크래시 없음)·정상 제출 접수 모달, 이미 참여한 초대장 공개링크 → 상세 리다이렉트.
- hostOperator: 참석자 관리 필터 칩/정렬 시트/검색 인터랙션 크래시 없음.

### 날짜 투표 링크 플로우 보정 (2026-06-06)
- [x] **공유 링크 경로 정합 수정** — ✅ `ROUTES.PUBLIC.INVITATION`이 잘못 `/invitations/:id`를 가리켜, 생성 직후 공유 링크가 공개 랜딩(`/i/:id`)이 아닌 상세 경로를 만들고 있었음. `/i/:id`로 수정.
- [x] **공유 링크 진입 후 투표 우선 진입** — ✅ `PublicInvitationContainer`에 post-RSVP 라우팅 분기 추가: 로그인 사용자가 이미 참가 중이거나 RSVP를 방금 제출한 경우, `getPoll` 결과가 `open`이면 `/invitations/:id/vote`로 우선 이동하고, 투표가 없거나 종료(`closed`/`confirmed`)면 상세(`/invitations/:id`)로 이동.
- [x] **회귀 테스트 추가** — ✅ `guest-edge.spec.ts`에 공개 링크 진입 시 진행 중 투표가 있으면 투표 화면으로 리다이렉트되는 케이스 추가. 기존 공개 링크 리다이렉트 테스트도 투표 상태(open/non-open) 분기를 반영하도록 보정.

### ⚠️ 환경 이슈 (재확인)
- **dev 서버(Next/Nest watch)가 장시간 E2E 중 간헐적으로 죽거나 일시 무응답** → 한 번에 전체 스위트(~3분)를 돌리면 중간에 :3000 또는 :3001이 내려가 다수 테스트가 `ERR_CONNECTION_REFUSED`/타임아웃으로 실패. 건강한 서버에서는 전부 green(run1 26/26). 완화책으로 `playwright.config.ts` `retries`를 로컬 1·CI 2로 상향(일시 블립 흡수). **권장 운영**: 스위트를 프로젝트 단위로 짧게 나눠 실행, 서버는 워처 1개씩만.
- 참고: 웹 `apiClient`가 단일 401(`TOKEN_INVALID`)에도 즉시 강제 로그아웃 → 일시 블립이 세션 종료로 증폭됨. 장기적으로 일시 오류와 진짜 만료 구분(재시도/백오프) 검토 여지.

### 미커버 영역 E2E 확장 (2026-06-06, 2차)
- [x] **댓글** — `guest-comments.spec.ts`: `/invitations/:id/comments` 스모크, 빈 입력 시 전송 버튼 disabled(no-op), 댓글 작성 반영, 상세 사진 앨범 섹션 렌더.
- [x] **프로필·계정** — `guest-profile.spec.ts`: `/profile/edit` 스모크, 닉네임 비움 → 저장 disabled, 완료 프로필 `/signup` 리다이렉트, `/terms/agree?returnTo=` 자동 이동, 회원 탈퇴 다단계 UI 탐색 후 최종 확인에서 취소(실제 탈퇴 미실행).
- [x] **회원가입 zod·약관(anon)** — `anon.spec.ts`: 빈/잘못된 형식 제출 시 zod 에러(HTML5 `novalidate`로 zod만 검증), 비로그인 `/terms/agree` 동의 버튼 disabled.
- [x] **투표 종료 후 공개 링크** — `guest-edge.spec.ts`: open poll 없을 때 `/i/:id` → 상세(`/invitations/:id`) 리다이렉트. `helpers.findGuestInvitationWithoutOpenPoll` 추가.
- **신규 앱 버그 없음** — 빈 댓글은 UI에서 전송 버튼 disabled로 이미 차단(의도된 no-op).
- **아직 미커버**: 프로필 사진 crop+S3 업로드, 앨범 presigned 실업로드/부분 실패, 댓글 답글 인터랙션, `/edit` 계속 제외.

### develop 최신화 + 미커버 E2E 3차 (2026-06-06)
- **develop fast-forward** (`a24e034` → `1237387`, PR #180 weather-redis-cache 등 13커밋) 후 stash 복원. 충돌 해결:
  - `_journal.json`: upstream `0005_gifted_zaladane` 유지 + activity-events를 `0006_user_activity_events`로 분리
  - `weather.service.ts`: Redis 캐시(upstream) + 중기예보 10일(stash) 병합
  - `InvitationCreateContainer.tsx`: develop(upstream) 채택
  - `GuestView.tsx`: `within10Days` + `useVoteResults` 로그인 가드 병합, `ShareBottomSheet` import 경로 수정
  - `pnpm-lock.yaml`: reinstall
  - `query-client.ts` 복원(authStore 의존)
- [x] **프로필 사진** — `guest-profile.spec.ts`: 파일 선택 → 크롭 UI, 크롭 후 업로드 시도(성공/실패 UI, 크래시 없음)
- [x] **앨범** — `guest-album.spec.ts`(신규): 미리보기·취소, 업로드 시도, 비이미지 파일 무시
- [x] **댓글** — `guest-comments.spec.ts`: 답글 작성, 내 댓글 수정·삭제 확인 모달 취소
- **검증**: guest 26/26, anon 13/13, newHost+hostOperator 7/7, admin 3/3 green. typecheck ✅
- **아직 미커버**: GIF 댓글, 앨범 부분 실패 시나리오(다중 파일 mock), `/edit` 제외

### 미커버 E2E 4차 (2026-06-06)
- [x] **GIF 댓글** — `guest-comments.spec.ts`: `/api/gifs/trending` mock → 초대장 상세 GIF 선택·댓글+GIF 등록
- [x] **댓글 좋아요** — `guest-comments.spec.ts`: 초대장 상세에서 좋아요 토글 2회, 크래시 없음
- [x] **앨범 부분 실패** — `guest-album.spec.ts`: 2장 업로드 mock(1번 presigned 성공·register, 2번 presigned 500) → `일부 사진 업로드에 실패했어요` UI
- **검증**: 신규 4건 + guest 전체 **29/29** green
- **아직 미커버**: `/comments` 페이지 GIF(현재 UI 미지원), 멘션(@) 댓글, `/edit` 제외

### 미커버 E2E 5차 (2026-06-06)
- [x] **helpers 보강** — `getOtherParticipantNicknames`, `getInvitationPhotos`, `waitForPublicLinkRedirect`(20s) 추가. `guest-edge` 리다이렉트 타임아웃 통일.
- [x] **멘션(@) 댓글** — `guest-comments.spec.ts`: 초대장 상세 피드백에서 `@` 드롭다운 선택·댓글 등록
- [x] **`/comments` GIF 미지원 검증** — `guest-comments.spec.ts`: GIF 선택 버튼 없음 assert
- [x] **답글 flaky 완화** — 부모 댓글 row 스코프 + placeholder 대기
- [x] **날짜 투표** — `guest-vote.spec.ts`(신규): `/vote` 스모크, 공개 링크 → 투표 응답(👍) 자동 저장
- [x] **사진 상세 모달** — `guest-photo.spec.ts`(신규): 그리드 클릭 → 모달 → 댓글 패널 → 사진 댓글 작성(사진 없으면 skip)
- [x] **알림 인터랙션** — `guest-notifications.spec.ts`(신규): 안 읽음 필터, 모두 읽음 확인 모달 취소, 알림 삭제(목록 있을 때)
- **검증**: guest **35/35** green (신규 6건 포함)
- **아직 미커버**: PhotoDetailModal 멘션/GIF, `/edit` 제외

### 미커버 E2E 6차 (2026-06-06)
- [x] **PhotoDetailModal 멘션·GIF** — `guest-photo.spec.ts`: 모달 댓글 패널에서 `@` 멘션·GIF mock 등록
- [x] **helpers** — `openFirstPhotoViewer`, `openPhotoViewerComments` 추가
- [x] **댓글 수정·삭제 flaky** — `guest-comments.spec.ts`: POST/PATCH 응답 대기, row 스코프 input·저장
- **검증**: guest **37/37** green (신규 2건: PhotoDetailModal 멘션·GIF)
- **아직 미커버**: `/edit` 제외

### 미커버 E2E 7차 — `/edit` (2026-06-06)
- [x] **웹 edit 모드 버그** — `InvitationCreateContainer`: 수정 시 CTA/확인 모달 문구, 날짜·장소 미정 초기화, 미션 검증 완화
- [x] **호스트 edit E2E** — `host-edit.spec.ts`: 더보기→수정 진입, 제목 PATCH 후 상세 반영 (`newHost`·`hostOperator` 공통)
- [x] **게스트 edit 거부** — `guest-edge.spec.ts`: 저장 시 실패 UI(403)

### E2E 2차 검증 — 엣지·예외·에러 처리 (2026-06-06)
- [x] **helpers** — `mockApiRouteFailure()` 추가 (API mock 500)
- [x] **anon 2차** — `/profile`·`/admin` 비로그인 시 `/login` 리다이렉트( middleware / 401 )
- [x] **guest 2차** — invalid ULID 초대장, `/admin` 권한 실패 UI, 멘션无매치, feedbacks/notifications GET 500 → ErrorState, presigned 전체 실패, photo 모달 닫기, non-open poll `/vote`(확정·마감·진행), 크롭 취소, 문의 제목만
- [x] **host 2차** — create/edit 빈 제목 validation, invalid id edit/participants ErrorState
- [x] **admin 2차** — analytics API mock 실패 → 섹션 Failed UI
- **검증**: anon 2차 2/2, guest 2차 11/11, newHost+hostOperator 2차 5/5 + 1차 flaky 1건, admin 2차 1/1 green
- **앱 버그 수정 없음** (테스트가 실제 동작에 맞게 조정: anon `/profile`은 소프트 가드가 아닌 middleware 리다이렉트)
- [x] **flaky 완화** — `expectNotCrashed`/`smokeVisit` 안착 대기, `clickHostMoreButton`(header scope), `waitForVotePageData`, anon 캘린더·terms assertion 현행 UI 반영, 문의 POST 응답 대기
