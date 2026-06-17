# 03 — 컴포넌트 시스템 · 레거시 매핑 · 키보드/접근성 · 마이그레이션 현황

> Partiful 기반 라이트 리디자인의 컴포넌트 계층, 레거시→신규 API 매핑, 키보드·접근성 규칙,
> 그리고 현재 마이그레이션 상태를 한곳에 정리한다.
> 방향·레퍼런스는 [01-direction](./01-direction.md), [02-partiful-reference](./02-partiful-reference.md) 참고.

---

## 1. 아키텍처

| 레이어 | 위치 | 역할 |
|---|---|---|
| 토큰 | `packages/tokens` (`@wara/tokens`) | 플랫폼 중립 디자인 토큰 → `css/tokens.css` 생성·커밋 (light 기본 + `[data-theme=dark]`) |
| 범용 UI | `packages/ui` (`@wara/ui`) | 아이콘·atoms·molecules. 도메인 타입 비참조 |
| 도메인 organism | `apps/web/src/components/domain` | `@wara/ui` 위에서 데이터 결합 (InviteCard, CommentItem 등) |
| 초대장 엔진 | `apps/web/src/components/invite` | 데이터 기반 템플릿 + framer-motion |

`@wara/ui`는 TS 소스로 직접 소비: `transpilePackages` + globals.css `@source` + `allowImportingTsExtensions`. 내부 import는 명시적 `.ts`/`.tsx` 확장자 사용.

---

## 2. `@wara/ui` 인벤토리

**atoms** — Text, Button, IconButton, Input, Textarea, Avatar/AvatarGroup, Divider, Badge, Chip, Spinner, Switch, **Radio/RadioGroup**, **Checkbox**
**molecules** — Modal, Drawer, BottomSheet, Toaster/`toast`, ConfirmDialog, **MenuItem**, FormField, SearchBar, Tabs, TopAppBar, BottomNavigation, EmptyState, ErrorState, LoadingState, Skeleton
**icons** — `Icon`(name 기반), `ICONS` registry, `IconName` (lucide-react 기반)

### 라이트 잉크 강조 규칙
선택/활성 상태는 brand 컬러가 아니라 **잉크(text/surface-inverse)** 로 표현한다 (Partiful 라이트). Radio·Checkbox·Switch 모두 `data-[state=checked]`에서 `border-text`/`bg-text` 계열 사용.

---

## 3. 도메인 organism 인벤토리

`apps/web/src/components/domain` — InviteCard, RSVPButtonGroup, ParticipantList/ParticipantRow, ProfileSummary, CommentBox, **CommentItem/CommentReplyItem** + `renderMentions`, MonthCalendar, DateTimeSelector, GalleryGrid, NotificationItem, WeatherCard, KakaoMap, **LocationCard**, **ShareOptionItem**, 헬퍼 `statusChipToBadge`.

> CommentItem/LocationCard/ShareOptionItem은 Phase 11에서 레거시 organism을 대체해 신규 작성됨 (react-icons → lucide, primitives/molecules → `@wara/ui`).

---

## 4. 레거시 → 신규 API 매핑 (마이그레이션 치트시트)

| 레거시 | 신규 | 비고 |
|---|---|---|
| `primitives/Button` `variant="outline"` | `@wara/ui` Button `variant="secondary"` | `text`/`primary`/`danger`는 동일 |
| `primitives/TextInput` `error="..."` | `@wara/ui` Input `invalid={boolean}` | leftIcon 검색은 `SearchBar` 사용 |
| `primitives/Avatar` `initial={x[0]}` | `@wara/ui` Avatar `name={x}` | 그라데이션 모노그램 자동 |
| `primitives/IconButton` `aria-label` | `@wara/ui` IconButton `label` (필수) | |
| `molecules/Modal` 컴파운드(`ModalContent`/`Close`/`Primitive`) | prop 기반 `Modal`(title/description/footer/children) | 단순 확인은 `ConfirmDialog` |
| `ConfirmModal` `confirmVariant="danger"` + `contained` | `ConfirmDialog` `tone="danger"` | `loading` 지원 |
| `BottomSheet` + `BottomSheetContent` | 단일 `BottomSheet`(title/`hideTitle`) | children 직접 |
| `molecules/Toast` `toast.show(msg)` | `@wara/ui` `toast(msg)` | `.error/.success`는 동일(sonner) |
| `organisms/InvitationCard` `variant`/`ddayLabel`/`date`/`location` | domain `InviteCard` `badge`(via `statusChipToBadge`)/`dateText`/`locationText` | `subject` eyebrow 지원 |
| 브랜드 로고(`kakao-logo` 등) | `MenuItem`/`ShareOptionItem`의 `leftSlot`/`iconNode` + 레거시 `Icon` | lucide에 브랜드 마크 없음 |

---

## 5. 키보드 UX · 접근성 규칙 (Phase 10)

- **포커스 링**: 전역 `:focus-visible { box-shadow: var(--focus-ring) }` (tokens.css, light/dark 각각 정의). 별도 ring 클래스 불필요.
- **오버레이**: Modal·Drawer는 Radix Dialog, BottomSheet는 vaul → **Esc 닫기·focus trap·포커스 복귀**가 기본 보장. 직접 구현 금지.
- **댓글 입력(CommentBox)**: Enter 전송 / Shift+Enter 줄바꿈 / Esc 비우기+blur. **`e.nativeEvent.isComposing` 가드로 한글 IME 조합 중 Enter 오전송 방지**.
- **아이콘 전용 버튼**: 가시 텍스트가 없으면 `aria-label` 필수. `@wara/ui` IconButton은 `label` 필수 prop으로 강제.
- **클릭 요소**: `div`/`li`에 `onClick` 금지 → `<button>`/`<a>` 사용 (키보드·스크린리더 대응). 불가피하면 `role="button"` + `tabIndex` + `onKeyDown`(Enter/Space).
- **데코 아이콘**: 의미 없는 아이콘은 `decorative`(=`aria-hidden`).

---

## 6. 마이그레이션 현황 (2026-06)

### 완료 — `apps/web/src/screens/*` 전 화면
Login, Notifications, MyPage, Settings, Onboarding, Signup, ProfileEdit, AccountSettings, HiddenFriends, HiddenInvitations, FriendProfile, FriendsList, ChatList, ChatDrawer, ChatRoom, PhotoViewer(Chat), Meetings, DateVote, Comments, MapPage.
→ 프레젠테이션을 `@wara/ui`/domain으로 교체, 데이터·로직·문구·라우트 보존.

### 제거됨 (Phase 11)
- `primitives/Radio`, `primitives/Checkbox` (→ `@wara/ui`)
- `molecules/ShareOptionItem`, `molecules/AutoSlide` (→ domain / 미사용)
- `organisms/CommentItem`(+ReplyItem/renderMentions), `organisms/LocationCard` (→ domain)

### 아직 레거시 (의도적 — 별도 마이그레이션 필요)
`src/domain/InvitationDetail/*`, `src/components/templates/*`, 일부 organism이 여전히 레거시 primitives/molecules에 의존한다. 이 때문에 다음은 **아직 제거 불가**:

- 폭넓게 사용 중인 레거시 primitives: Button, Avatar, IconButton, Badge, TextInput, Chip, SocialLoginButton, Switch, Textarea, Divider
- 레거시 molecules: BottomSheet, TopAppBar, Modal, FormField, SearchBar, MenuItem, Toast 등
- `src/styles/_legacy.css` (globals.css에서 import 중) — 미마이그레이션 컴포넌트가 의존
- `react-icons` 의존 — `organisms/PhotoGridItem`, `organisms/PhotoViewer`가 아직 사용
- 무화면 skeleton(ProfileSkeleton 등)·`ParticipantProfileModal`·`FriendsIndexBar`·`CommentInputBar`

> 위 영역(InvitationDetail·Album/Photo·templates)을 `@wara/ui`/domain으로 마저 옮긴 뒤에야
> 레거시 `primitives`/`molecules` 트리, `_legacy.css`, `react-icons` 의존, `src/styles/DESIGN.md`를
> 완전히 제거할 수 있다.

---

## 7. 검증

PR 머지 전: `pnpm lint && pnpm typecheck && pnpm test && pnpm build` + 관련 e2e.
컴포넌트 시각 확인은 Storybook(`Pages/*`, atoms/molecules 스토리, 테마 툴바 light/dark).
