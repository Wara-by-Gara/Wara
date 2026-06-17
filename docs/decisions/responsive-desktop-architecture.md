# 반응형 데스크톱 아키텍처

> `apps/web`을 모바일 전용 → 반응형 + 데스크톱 전용 패턴으로 확장하는 기준 문서.
> 핵심 원칙: 데스크톱 분기는 `lg:` 접두사로만 **추가**한다. 모바일/태블릿(<1024)은 변경하지 않아 회귀 위험을 구조적으로 0으로 만든다.

---

## 1. Breakpoint — 3단계, 데스크톱 전환은 `lg`(1024px)

`md`(768px)는 소형 태블릿까지 포함돼 데스크톱 전환점으로 애매하다.

| 구간 | 폭 | 레이아웃 |
|---|---|---|
| mobile | `< 768` | 기존 모바일 (변경 없음) |
| tablet | `768 ~ 1023` | 기본은 모바일과 동일. 그리드만 `md:`로 중간 컬럼 단계 허용 |
| desktop | `>= 1024` | `lg:`에서 폭 확장·분할 뷰·헤더 네비 |

→ 실제 데스크톱 레이아웃 전환은 **`lg:` 기준**. 그리드는 `md:grid-cols-2 lg:grid-cols-3`처럼 단계적.

> 기존 `apps/web/CLAUDE.md`의 `md:` 분기 + `max-w-4xl/2xl` 컨벤션은 이 문서 기준(`lg:` + 아래 폭 체계)으로 대체된다. 구 admin `md:` 카드/테이블 쌍은 DataTable 전환(PR8) 시 정리.

---

## 2. 콘텐츠 폭 — 시각 콘텐츠(사진·초대장) 비중이 높아 넓게

| 용도 | 데스크톱 폭 |
|---|---|
| 목록/그리드 | `max-w-7xl` |
| 상세 | `max-w-4xl` |
| 좁은 폼/설정 | `max-w-2xl` |
| 채팅·지도·대시보드 | `max-w-none` (full-bleed) |

---

## 3. `PageLayout` `size` prop 매핑

`apps/web/src/components/layout/PageLayout/PageLayout.tsx`. **모바일/태블릿은 항상 `max-w-md` 중앙 정렬, `lg:`에서만 확장.**

```tsx
size="sm"   // max-w-md → lg:max-w-2xl  (폼/설정)   ← default
size="md"   // max-w-md → lg:max-w-4xl  (상세)
size="lg"   // max-w-md → lg:max-w-7xl  (목록/그리드)
size="full" // max-w-none               (채팅/지도/대시보드)
```

**default는 `"sm"`** — 기존 모바일 페이지 다수가 설정·마이페이지·알림·친구 등 좁은 화면이라, 넓힘(`md`/`lg`/`full`)은 명시적으로 선언해야 안전하다. `<lg`에서는 default가 기존 `max-w-md`와 100% 동일하다.

---

## 4. 네비게이션 — RootLayout에서 분리 렌더

`MainBottomNav` 안에서 `TopNavigation`을 렌더하지 않는다. 둘 다 RootLayout 직속 독립 컴포넌트:

```
RootLayout
 ├ TopNavigation  (hidden lg:flex   — 데스크톱 상단 헤더)
 ├ MainBottomNav  (lg:hidden        — 모바일/태블릿 하단 탭)
 └ Content        (lg:pt-[var(--header-height)])
```

공통 데이터/로직(`MAIN_BOTTOM_NAV_ITEMS`, active 판정, `HIDDEN_PATHS`, 로그인 시트)은 공유 hook/`lib`로 추출해 두 컴포넌트가 import한다. 로직 중복 0.

### StickyHeader 충돌 규칙 (2단 헤더 방지)

전역 `TopNavigation`과 페이지별 `StickyHeader`를 둘 다 `sticky/fixed`로 두면 데스크톱에서 헤더가 2단으로 쌓인다.

- **모바일/태블릿(<lg):** 기존 그대로 — `TopNavigation` 없음, `StickyHeader`가 상단 sticky.
- **데스크톱(`lg:`):** `TopNavigation`만 fixed. 페이지별 `StickyHeader`는 sticky 해제 → 본문 컬럼 최상단 인라인 헤더로 강등(`lg:` 분기로 sticky/offset 클래스 제거). 제목·페이지 액션은 유지하되 고정 바가 아니라 콘텐츠 흐름 안에 배치. 모바일 전용 back 버튼은 데스크톱에서 숨김(`lg:hidden`).

→ `StickyHeader` 한 곳만 `lg:` 분기를 추가하면 전 페이지에 일괄 적용.

---

## 5. 헤더 높이 토큰

`globals.css @theme`에 `--header-height: 64px` 정의. 본문 오프셋·sticky 계산에 재사용(하드코딩 금지).

---

## 6. 데스크톱 전용 패턴 (단순 폭 확장이 아님)

| 화면 | 데스크톱 전용 패턴 |
|---|---|
| 초대장 생성 | 좌측 폼 / 우측 실시간 미리보기 2-pane |
| 사진(앨범/탐색) | Masonry Grid |
| RSVP/참가자 | 테이블 |
| 관리자 | DataTable |
| 채팅/지도/상세 | Master–Detail 2-pane |

### Master–Detail 2-pane 공통 패턴

**원칙: 모바일 동작·라우팅 불변. 데스크톱(`lg:`)에서만 모달/시트 내용을 옆 패널에 인라인.** 진입/퇴장 모션 추가 금지(Phase 10).

- 모바일: 기존(라우트 전환 또는 `BottomSheet`/`Modal`).
- 데스크톱: `lg:flex` 2-pane, 좌측 master + 우측 detail. 선택 상태 = 기존 라우팅/`useState` 재사용(새 상태 머신 금지).
- 적용: 초대장 상세(시트→우측 패널), 사진 지도(지도+상세), 채팅(목록+방).

---

## 7. PR 순서 (각 PR = 독립, 위험 낮은 순)

각 PR 머지 전 `pnpm lint && pnpm typecheck && pnpm test && pnpm build` 통과.

1. **PR1** — Layout / PageLayout 기반 (`size` prop, `--header-height`, 문서). 동작 무변경.
2. **PR2** — Desktop Header (`TopNavigation` 신규, RootLayout 분리, `StickyHeader` `lg:` 분기, nav 공통 로직 추출).
3. **PR3** — 일반 페이지 폭 확장 (프로필/설정/계정/친구/알림/문의/약관/온보딩).
4. **PR4** — 목록 Grid (홈/meetings/explore/앨범 목록).
5. **PR5** — 초대장 상세 2-Pane (Master–Detail 패턴 확립). 초대장 생성 좌폼/우프리뷰.
6. **PR6** — 사진 지도 2-Pane + Masonry.
7. **PR7** — 채팅 2-Pane (상태/소켓/읽음 처리 때문에 가장 위험 → 마지막).
8. **PR8** — 관리자 DataTable.

---

## 8. 미해결 결정 포인트

- 채팅/지도 화면에서 데스크톱 헤더(`TopNavigation`) 노출 여부 → PR2/PR6/PR7에서 확정.

---

## 검증

1. 각 PR 후 `pnpm lint && pnpm typecheck && pnpm test && pnpm build`.
2. 회귀: 393px·768px 뷰포트에서 변경 페이지가 기존과 동일(`lg:` 분기 보장).
3. 데스크톱: 1440px에서 헤더 노출, 폭 확장(목록 `7xl`/상세 `4xl`/채팅·지도 full), 그리드/Masonry, 2-pane, Admin DataTable.
