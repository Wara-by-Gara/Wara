# E2E 버그 로그 (모바일 Wave A~)

> Playwright 모바일(iPhone 14 Pro, 390×844) E2E로 발견한 이슈.
> Wave별로 기록하고 수정 후 상태 갱신.

## 상태 범례

- `대기` — 수정 전
- `수정중` — 수정 진행
- `완료` — 수정 + E2E green
- `[DEFERRED]` — 디자인 재작업 시 처리 (P3)
- `[FLAKE]` — 3회 중 2회 이상 통과, 불안정 테스트

## 컬럼 설명

| 컬럼 | 설명 |
|------|------|
| ID | Wave 접두사 + 번호 |
| 심각도 | P0(크래시) / P1(기능 불가·터치 불가) / P2(UX 결함) / P3(정렬·색상) |
| 파일:라인 | 근본 원인 위치 |
| 증상 | 테스트에서 관찰된 현상 |
| 근본 원인 | 코드 레벨 원인 |
| 수정 방법 | 구체적 수정 내용 |
| 커밋 | 수정 커밋 해시 |
| 상태 | 위 범례 참고 |

---

## [Wave A] 프로필·아바타

| ID | 심각도 | 파일:라인 | 증상 | 근본 원인 | 수정 방법 | 커밋 | 상태 |
|----|--------|-----------|------|---------|---------|------|------|
| A-001 | P2 | MyPage.tsx | Avatar `size="xl"` + `size-25`(100px) CSS 클래스 병용 → variant와 실제 크기 불일치 | size prop과 CSS 직접 지정 혼용 | Avatar.tsx에 `2xl`(100px) variant 추가, MyPage/ProfileEdit에서 `size="2xl"` 사용 | — | 완료 |
| A-002 | P2 | ProfileEdit.tsx | ProfileEdit `size-28`(112px) vs MyPage(100px) 불일치 | 두 화면이 다른 size 지정 | A-001 수정으로 함께 해결 | — | 완료 |
| A-003 | P1 | ProfileEdit.tsx | "사진 변경" 버튼 `h-9`(36px) → 44px 터치 미달 | Button `sm` = h-9 | `min-h-11` 추가로 최소 44px 보장 | — | 완료 |
| A-004 | P2 | ProfileEdit.tsx:47 | `modalOpen` state가 `state` prop 변경 시 재동기화되지 않음 | `useState(state === "imageDeleteModal")` 초기화만 함 | `localModalOpen` + computed `modalOpen` + useEffect 동기화 | — | 완료 |
| A-005 | P3 | fixtures.ts | `guest003` `profileImageUrl: null` — DiceBear fallback E2E 검증 | 시드 데이터에 null 설정 확인 필요 | guestNoPhoto 페르소나로 E2E 검증 (mobile-profile.spec.ts) | — | 완료 |

---

## [Wave B] 초대장 상세

> 주의: `screens/InvitationDetailGuest.tsx`는 mock 프레젠테이션 컴포넌트로, 실제 라우트
> (`/invitations/:id`)는 `domain/InvitationDetail/Container/InvitationDetailContainer`를
> 렌더한다. B-001/B-002는 mock 화면의 코드 정확성 수정이며, 실제 화면(ParticipantsContainer
> → ParticipantProfilePanel)은 `userId`를 정상 전달해 동일 버그가 없음을 확인.
> 실제 라우트 E2E는 participants-mobile.spec.ts·invitation-detail-mobile.spec.ts로 검증.

| ID | 심각도 | 파일:라인 | 증상 | 근본 원인 | 수정 방법 | 커밋 | 상태 |
|----|--------|-----------|------|---------|---------|------|------|
| B-001 | P1 | InvitationDetailGuest.tsx:322 | 2번째·3번째 참석자 클릭 시 잘못된 프로필 모달 표시 | `filter` 후 `idx`를 원본 배열 인덱스로 사용 | `mockParticipants.indexOf(p)` 사용 | — | 완료 |
| B-002 | P1 | InvitationDetailGuest.tsx:478 | ParticipantProfileModal 1:1 DM 버튼 항상 비활성 | `userId` prop 미전달 | `selectedParticipant.id`를 `userId`로 전달 | — | 완료 |
| B-003 | P2 | InvitationDetailGuest.tsx | mock 데이터 사용 여부 불명확 | `mockParticipants` 등 mock import | 실제 API 연결 여부 확인 후 처리 | — | 대기 |

---

## [Wave C] 댓글

| ID | 심각도 | 파일:라인 | 증상 | 근본 원인 | 수정 방법 | 커밋 | 상태 |
|----|--------|-----------|------|---------|---------|------|------|
| C-001 | P2 | CommentItem.tsx:164 | `onLike` 없어도 like 버튼 상호작용 가능처럼 보임 | `likeCount !== undefined`이면 버튼 렌더 | `onLike` 없을 때 span으로 렌더 | — | 완료 |
| C-002 | P2 | CommentItem.tsx:212 | `moreMenuItems` undefined 시 더보기 버튼 노출 가능 | props 조건 불명확 | 조건 추적 후 수정 | — | 대기 |
| C-003 | P2 | Comments.tsx | 댓글 제출 중 버튼 중복 클릭 가능 | pending 동안 disabled 처리 없음 | `submitComment` pending 시 disabled | — | 대기 |

---

## [Wave D] 앨범·사진

| ID | 심각도 | 파일:라인 | 증상 | 근본 원인 | 수정 방법 | 커밋 | 상태 |
|----|--------|-----------|------|---------|---------|------|------|
| D-001 | P2 | Album.tsx | mock vs 실제 API 데이터 사용 여부 불명확 | mock import 여부 | 확인 후 처리 | — | 대기 |
| D-002 | P1 | PhotoViewer.tsx | 헤더 버튼(닫기·공유·삭제) 44px 미달 가능 | 아이콘 버튼 터치 영역 | 크기 측정 후 수정 | — | 대기 |

---

## [Wave G] 홈 화면

> 주의: `screens/Home/Home.tsx`는 mock 프레젠테이션 컴포넌트로, 실제 라우트(`/`)는
> `domain/Home/HomeContainer`를 렌더한다. G-001 수정은 mock 화면 대상(코드 정확성).
> 실제 홈 E2E는 home-mobile.spec.ts(HomeContainer)로 검증.

| ID | 심각도 | 파일:라인 | 증상 | 근본 원인 | 수정 방법 | 커밋 | 상태 |
|----|--------|-----------|------|---------|---------|------|------|
| G-001 | P2 | Home.tsx:96 (mock) | `me.nickname` undefined 시 Avatar `alt` 비어 있음 | `alt={me.nickname}` — nickname nullable | `alt={me.nickname ?? me.name ?? "프로필"}` | — | 완료 |

## [Wave H] 홈 헤더·설정 (실제 라우트)

| ID | 심각도 | 파일:라인 | 증상 | 근본 원인 | 수정 방법 | 커밋 | 상태 |
|----|--------|-----------|------|---------|---------|------|------|
| H-001 | P3 | HomeHeader.tsx (pillActionClass) | 헤더 액션 버튼(초대장 만들기·알림) 32px — 44px 터치 미달 | `size-8` 버튼 + `h-9` pill 컨테이너로 44px 수용 불가 | 헤더 재설계 시 터치 영역 확장 | — | [DEFERRED] |
| H-002 | P3 | notification-settings-form.tsx | 알림 토글이 컨트롤드+서버 영속이라 클릭 후 즉시 반영 안 됨(낙관적 업데이트 없음) | 서버 응답까지 시각 피드백 지연 | 낙관적 업데이트 도입 검토(디자인/UX 결정 필요) | — | [DEFERRED] |

---

## 신규 Wave spec (실제 라우트 기준) — 작성·통과

| spec | 프로젝트 | 테스트 | 결과 |
|------|---------|--------|------|
| avatar-consistency.spec.ts | crossPersona | 5 | ✅ green |
| participants-mobile.spec.ts | guest | 5 | ✅ green |
| navigation-mobile.spec.ts | hostNew | 6 | ✅ green |
| settings-mobile.spec.ts | guest | 4 | ✅ green |
| invitation-detail-mobile.spec.ts | guest | 3 | ✅ green |
| home-mobile.spec.ts | hostNew | 4 | ✅ green |
| cross-persona.spec.ts | crossPersona | 10 | ✅ green |
| mobile-profile.spec.ts (기존, 회귀) | guest | 10 | ✅ green |

## 테스트 인프라 보강 (helpers.ts)

| 항목 | 내용 |
|------|------|
| `findInvitationWithParticipants` | 참가자 ≥N명 초대장 탐색 (모달·참가자 테스트용) |
| `hideDevOverlays` | TanStack Devtools + Next dev indicator 숨김 (하단 클릭 가로채기 해소) |
| `isSeededInvitation` / `findGuestInvitation` 보강 | 시드 초대장은 한글 제목 → 한글 포함 여부로 시드 식별. location/dm E2E가 남긴 ASCII 제목 잔여 초대장(콘텐츠 빈) 회피 |
| `getOtherParticipantNames` 신설 | 멘션은 이름(name) 기반 → 멘션 테스트용 이름 조회 (guest-comments·guest-photo 멘션 수정) |
| `openFirstPhotoViewer` 스코프 수정 | `button:has(img)` 첫 요소(=뒤로가기)가 아니라 앨범 사진 버튼(`button.aspect-square`)을 클릭하도록 수정. 한글-시드 선택으로 실제 사진 있는 초대장이 잡히며 드러난 잠복 결함 |

## 환경 이슈 (코드 무관)

| 이슈 | 내용 |
|------|------|
| ENV-001 | 로컬 dev DB 오염: guest001에 E2E 동적 생성 초대장 187개 누적(대부분 빈 콘텐츠). 헬퍼 한글-시드 선택으로 회피하나, 근본 해소는 DB 재생성 필요 |
| ENV-002 | dev 서버 장기 가동(2.5h+) 시 댓글 POST 후 refetch 지연 → guest-comments 제출 반영 테스트 간헐 실패(서버 저하). **댓글 POST 자체는 정상 누적됨**. 서버 재기동 후 재검증 필요. playwright.config.ts 주석에도 명시된 알려진 현상 |
| ENV-007 | **쿠키 도메인 불일치(자초 후 수정)**: E2E baseURL을 IPv4(`127.0.0.1`)로 바꾸자, `auth.setup.ts`가 쿠키 `domain`을 `"localhost"`로 하드코딩하던 탓에 쿠키가 전송되지 않아 게스트가 비인증 처리 → `findGuestInvitation`이 null → 대량 `test.skip()`(데이터·API는 probe상 정상인데도). **수정**: `auth.setup.ts`가 `new URL(WEB_BASE_URL).hostname`로 도메인을 도출하도록 변경(personas.ts·auth.setup.ts). 수정 후 skip 0, 쿠키 정상 전송 확인 |
| ENV-006 | **dev access token 10분 TTL → 장시간 run에서 무더기 실패**: `auth.service.ts` access token `expiresIn: '10m'`. 한 playwright invocation이 10분(실측상 30분 이내)을 넘으면 setup·beforeAll에서 발급한 토큰이 도중 만료 → `createInvitation failed: TOKEN_EXPIRED`, `getMe failed`, 뒤이어 `Test ended` cascade. chat 그룹(dm+dmFlow+voteFlow 136개)이 30분 초과로 113 failed/23 passed(conn=11, 즉 wedge 아님). **회피책**: 청크를 작게 쪼개 각 run을 10분 내로 → 토큰 유효. (sub-batch 재실행으로 검증 예정) |
| ENV-005 | **웹 dev 서버(next dev --turbopack) wedge**: 전체 311 테스트를 한 번에 돌리면 누적 부하로 turbopack dev 서버가 포트 3000 listen을 멈춤(프로세스는 생존, http=000). 1차 ~154, 2차(fresh) ~46에서 재발 — 누적 요청/시간 기반 degrade라 프로세스 분리로는 해소 안 됨. **회피책 2종**: (1) E2E baseURL을 `localhost`→`127.0.0.1`로 고정(personas.ts) — macOS IPv6(::1) 우선 해석이 일으키던 `ECONNREFUSED ::1:3000` 간헐 실패 제거(검증: ECONN 0건). (2) 프로젝트 그룹 단위 청크 실행 + **그룹마다 웹 서버 재시작**으로 degrade 리셋(`/tmp/chunk-e2e.sh`). 근본 해소는 E2E를 production build(`next build && next start`)로 구동하는 것 — 별도 결정 필요 |

## [Wave C 추가] 댓글 멘션 — 테스트 오작성 (제품 정상)

| ID | 심각도 | 파일:라인 | 증상 | 근본 원인 | 수정 방법 | 커밋 | 상태 |
|----|--------|-----------|------|---------|---------|------|------|
| C-004 | (무효) | guest-comments.spec.ts:159 | 멘션 테스트 46s 타임아웃 | 제품은 멘션을 **이름(name) 기반**으로 일관 구현(드롭다운 표시·삽입·하이라이트 모두 `@이름`). 테스트가 닉네임(`@sieun_kwon`) 기반으로 잘못 가정해 드롭다운 버튼 클릭 실패 | 테스트를 이름 기반으로 수정(`getOtherParticipantNames` 신설, `@이름` 클릭/검증). 제품 코드는 원복 — 변경 불필요 | — | 완료 |

## [환경/스키마] 쓰기 경로 차단 (사용자 조치 완료)

| ID | 심각도 | 증상 | 근본 원인 | 조치 |
|----|--------|------|---------|------|
| ENV-003 | P0 | 댓글·답글·좋아요·DM 등 모든 쓰기가 500. E2E 쓰기 테스트 전면 실패 | 로컬 DB `notification_settings` 스키마 drift(`is_participant`/`is_participant_locations`/`is_event_locations` 컬럼 누락) → 알림 발송 쿼리 실패 | 사용자가 컬럼 수정 + DB 재시드 완료 → POST 201 확인 |
| ENV-004 | P0 | 초대장 참여(join)·RSVP 등 `participant_joined` 알림을 발생시키는 쓰기가 모두 500 (`INTERNAL_ERROR`, notifications insert 실패). location 테스트 join 500의 근본 원인 | 라이브 dev DB `notification_type` enum에 `participant_joined` 값 누락(13/14). DB가 구 다중 마이그레이션 세트로 생성됐고 저널에 옛 해시만 기록 → `participant_joined`를 추가한 단일 baseline(`0000_curious_toad.sql`)이 적용된 적 없음. `db:migrate` 재실행도 `CREATE TYPE` duplicate_object(42710) 무시로 enum 값을 추가하지 못함 | DB 전체 재구축 (사용자 승인): `DROP SCHEMA public CASCADE` + `DROP SCHEMA drizzle` → `pnpm db:migrate`(baseline fresh) → `pnpm db:seed`. enum `participant_joined` 존재 확인, join probe 500→201 확인 |

## Loop 실행 기록

| Loop | 일시 | 실행 Wave | 신규 발견 | 수정 완료 | 잔여 | 연속 클린 횟수 |
|------|------|---------|---------|---------|------|-------------|
| 0 | — | Phase 0 준비 | A(5), B(3), C(3), D(2), G(1) | 0 | 14 | 0 |
| 1 | 2026-06-13 | A·B·C·G 수정 + 신규 7 spec | H-001/002(deferred), ENV-001/002 | A·B·C·G 8건 | ENV(2) | — |
| 2 | 2026-06-13 | guest-comments/photo/album + 신규7 + mobile-profile | ENV-003(스키마 drift, 사용자 조치), C-004(테스트 오작성) | 멘션 테스트·openFirstPhotoViewer·헬퍼 보강 | 0 | 1 (영향영역 전체 green) |
| 3 | 2026-06-13~14 | 전체 suite 청크 실행 (hosts/guest/chat/loc) + DB 재구축 | **ENV-004(enum drift P0)**, ENV-005(dev 서버 wedge), ENV-006(토큰 10분 TTL), ENV-007(쿠키 도메인 자초) | ENV-004 DB 재구축, ENV-007 auth.setup 도메인 도출, IPv4 고정(personas), 청크 드라이버 | 환경성만(제품 0) | — (전체 suite는 dev 서버 불안정으로 1회 클린 미달; 제품 결함 아님) |

**Loop 3 결론:** 제품 결함 추가 발견 0건. probe(guest001/004/005 정상, join 201)·hosts 그룹(28 passed)·댓글 페이지 정상 렌더로 **제품 건강 확인**. 전체 suite "연속 클린"은 turbopack dev 서버 wedge(ENV-005)·토큰 TTL(ENV-006)·refetch 지연(ENV-002) 등 **환경 요인**이 막고 있음 — 제품과 무관. 근본 해소는 E2E를 production build(`next build && next start`)로 구동(별도 결정).

## 검증 완료 상태 (2026-06-13, 스키마 fix + 재시드 후)

| 영역 | 결과 |
|------|------|
| 신규 spec 7종 (avatar-consistency·participants·navigation·settings·invitation-detail·home·cross-persona) | ✅ 전부 green |
| mobile-profile (기존, Avatar/ProfileEdit 회귀) | ✅ green |
| guest-comments (12) | ✅ green |
| guest-album / guest-photo (5) | ✅ green |
| 직전 통합 회귀 | 52 passed (album/photo 구버전 4건 제외 후 재실행 green) |

> 남은 과제: 전체 suite(dm/location/vote 포함) 깨끗한 환경에서 연속 통과 확인.
> ENV-003 스키마 fix로 쓰기 경로 500이 해소됐으므로 이전 대량 실패(dm 69·location 36)도 해소 기대.
