# 04 — StyleSeed 규칙 차용 (WARA × StyleSeed)

> [StyleSeed](https://github.com/bitjaru/styleseed)의 디자인 **원칙·규칙·모션 보캐뷸러리만** 차용해
> WARA의 완성도·규율을 끌어올린다. 외부 도구/의존성(`/ss-*`·shadcn·Radix skin·`data-skin`)은 도입하지 않으며
> 기존 `@wara/tokens` + CVA 시스템을 SoT로 유지한다.
> 방향·레퍼런스는 [01-direction](./01-direction.md), 컴포넌트 인벤토리/마이그레이션은 [03-component-system](./03-component-system.md) 참고.
> 이 문서는 그 위에 얹는 **규칙집**이다.

---

## 0. 핵심 원칙 — 앱 셸 절제 / 초대장 캔버스 비비드

StyleSeed 규칙의 다수는 **미니멀 SaaS·대시보드** 전제다. WARA는 파티/초대장 앱(보라–핑크 네오팝·글래스·이모지·비비드).
따라서 StyleSeed를 **선별·번안**해 적용하며, 충돌 규칙은 영역으로 분리한다 (01-direction의 "앱 셸 중립 글래스 / 초대장 캔버스 비비드" 원칙과 동일).

- **앱 셸**(알림·마이페이지·설정·친구·채팅·목록 등): StyleSeed식 절제 — 5단계 그레이 텍스트 위계, 4~8% 중립 그림자, 섹션 리듬, pill 토글.
- **초대장 캔버스**(`components/invite/*`, 템플릿 10종, `InvitationCover`): 비비드·네온 글로우·그라데이션 **유지(의도적 예외)**. 본 규칙집은 여기 적용하지 않는다.

---

## 1. 74개 규칙 — TRANSFER / EXCLUDE / RECONCILE

| 규칙 영역 | 상태 | WARA 적용 |
|---|---|---|
| 5단계 그레이 텍스트 위계 (순수 #000 금지) | **TRANSFER** | `text`/`text-secondary`/`text-muted`/`text-subtle`/`text-disabled` (아래 §2) |
| 그림자 4~8% · 컬러 그림자 금지 | **TRANSFER** (앱 셸) | `shadow-card`/`shadow-hover`/`shadow-modal` (중립 잉크) |
| 섹션 리듬 (`space-y-6`, 단일카드 `mx` / 그리드 `px`, cards-only, `rounded-2xl`) | **TRANSFER** | `--spacing-section-gap`·`--radius-lg/xl` 재사용 (§3) |
| 버튼 변형·높이 사다리 | **TRANSFER** | `xs 32 / sm 36 / md 44 / lg 54` (StyleSeed 32/36/40/52 정렬, `lg`는 파티 히어로 CTA로 54 유지) |
| pill 토글 셀렉션 (2~4 옵션, 잉크 강조) | **TRANSFER** | 기존 Chip·Tabs (이미 pill + `border-text` 적용) |
| Loading(300ms delay+최소표시) / Empty / Error 패턴 | **TRANSFER** | `LoadingState`·`EmptyState`·`ErrorState` molecules + delay/min |
| a11y 바닥선 (대비 ≥4.5:1, 44px 터치, 포커스 링, 색상 단독 금지, 시맨틱 HTML) | **TRANSFER** | 포커스 링은 `:focus-visible` 중앙화 완료 |
| 모션 (진입 stagger, transition fast 100~150ms, reduced-motion) | **TRANSFER** | 모션 시드 (§4) |
| KPI 그리드 · 도넛/세그먼트 차트 · 숫자 카운팅 · 숫자+단위 2:1 · 카드당 4항목 제한 | **EXCLUDE** | 대시보드 전용, 파티앱 무관 |
| "키 컬러 1개 + 나머지 회색조" | **RECONCILE** | 앱 셸만 잉크 강조 / 초대장 캔버스는 비비드 |
| "컬러 그림자 금지" | **RECONCILE** | 앱 셸만 중립 그림자 / 초대장 캔버스는 글로우 유지 |

---

## 2. 텍스트 위계 (5단계)

`packages/tokens/src/colors.ts` `semanticColors` — 어둡→밝은 순:

| 토큰 | light | dark | 용도 |
|---|---|---|---|
| `text` | `#14121A` | `#F4F1FA` | 본문·제목 (1차) |
| `text-secondary` | `#4A4556` | `#CFC9DC` | 보조 본문 (2차) |
| `text-muted` | `#6B6577` | `#ADA6BD` | 설명·메타 (3차) |
| `text-subtle` | `#807A8C` | `#8B85A0` | 캡션·eyebrow (4차) |
| `text-disabled` | `#A8A3B3` | `#6E6880` | 비활성 (5차) |

Tailwind 유틸: `text-text` / `text-text-secondary` / `text-text-muted` / `text-text-subtle` / `text-text-disabled`.

> **대비 주의**: `text-subtle`(light)는 흰 배경에서 약 4.13:1 — 본문(≥4.5:1) 미달. **캡션·eyebrow 등 큰/비핵심 텍스트(≥3:1)에만 사용**, 본문엔 `text-muted` 이상을 쓴다. (StyleSeed 자체 tertiary #7A7A7A ≈4.27:1과 동일한 취급)

---

## 3. 섹션 리듬 · 라운드 · 그림자 (토큰 매핑)

새 스페이싱/라운드 토큰은 신설하지 않고 **기존 토큰 재사용**:

- 섹션 간격 → `--spacing-section-gap` (32px) / 4pt 스케일
- 카드 라운드 → `--radius-lg`(20) · `--radius-xl`(28)
- 그림자(앱 셸) → `shadow-card`(기본) · `shadow-hover`(호버) · `shadow-modal`(모달) — 모두 4~8% 중립 잉크, 컬러 그림자 없음
- 단일 카드는 `mx-*`(떠 보임) / 그리드·풀블리드는 `px-*`. 카드 안에만 콘텐츠, 섹션 사이 divider 금지

기존 `--ev-xs..xl` 그림자와 글로우는 **그대로 둔다** — 초대장 캔버스가 사용한다. 앱 셸 코드는 `shadow-card/hover/modal`을 쓴다.

---

## 4. 모션 시드

값 SoT = `packages/tokens/src/motion.ts`의 `duration`·`easing`·`spring`(framer-motion 미emit, TS 전용).
시드 모듈(framer-motion `Variants`/`Transition`)은 **`apps/web`에 위치**한다 — framer-motion이 `apps/web` 의존성이고
`@wara/ui` atoms는 framer-motion이 필요 없기 때문(Toast=sonner, Button=CSS press). 기존 `components/invite/presets/motionPresets.ts` 선례와 일치.

| 시드 | 성격 | 적용처 |
|---|---|---|
| **Spring** (메인) | 통통·에너제틱 | 버튼/토스트/성공 상태 |
| **Pulse** | 리드미컬·생동 | 알림·상태 dot (NotificationItem unread 등) |
| **confetti-pop / glow-pulse** | 축하 | RSVP 확정·초대장 생성 등 |
| 진입 stagger | 순차 등장 | 첫 마운트 섹션 컨테이너만 |

**가드레일:**
- **"payload는 절대 모션 지연 금지"** — 메시지·RSVP 카운트·리스트·검색 결과는 즉시 렌더. 진입 stagger는 chrome(섹션 컨테이너)에만, React Query 데이터 갱신엔 적용 안 함.
- 시드는 `opacity`/`transform`/`box-shadow`만 애니메이트.
- `prefers-reduced-motion` 존중 — framer-motion `useReducedMotion` 단일 경로(기존 `MotionLayer.tsx`와 동일).
- 긴 리스트는 컨테이너만 stagger, Pulse는 dot 1개로 제한 (perf).
- 첫 페인트 화면(Login/Signup)의 진입 애니는 마운트(`useEffect`) 뒤 게이트 — SSR 마크업은 정적(하이드레이션 안전).

> **⚠️ 기존 결정 supersede**: WARA는 애니메이션을 "Phase 10 일괄"로 연기하기로 돼 있었으나(auto-memory `project_phase10_animations.md`),
> 본 StyleSeed 차용 작업으로 **모션을 앞당겨 구현**하기로 사용자가 결정함(2026-06-17). Phase 4~9 "모션 금지" 제약은 본 작업 범위 내에서 해제된다.

---

## 5. 레거시 공존

`apps/web/src/styles/theme.css`의 레거시 `--color-gray-*`·`--shadow-*`(최대 14%)는 `@wara/tokens`와 중복된다.
**삭제하지 않고 deprecated-in-place로 둔다**(별도 후속 PR 정리). 앱 셸 신규/수정 코드는 `@wara/tokens`의 `text-*`·`shadow-card/hover/modal`을 SoT로 사용한다.
