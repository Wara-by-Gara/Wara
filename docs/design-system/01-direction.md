# WARA 디자인 시스템 — 방향서 (Phase 0 산출물)

> 상태: **GATE 1 확정 완료** (무드 B 네오-팝+글래스모피즘 / 보라–핑크 / Font Awesome / invite 앱 내부). 다음은 Phase 1 토큰 구축.
> 레퍼런스: `docs/design-refs/` Partiful iOS 234장(다크) + 사용자 리디자인 지시서 + `docs/design/web-redesign-ai-prompt.md`(화면 IA·UX 우선순위).

---

## A. 레퍼런스 분석 (Partiful)

234장에서 추출한 디자인 언어:

- **다크 우선 + 비비드 멀티 포인트**: 거의 순검정(#000~#0c0a12) 배경 위에 핑크·보라·형광 그린·옐로우 등 강한 포인트. 초대장 커버마다 색이 다름(= 템플릿 다양성).
- **타이포**: 굵은 디스플레이 헤드라인 + 일부 화면에 스크립트/손글씨 폰트 혼용("What's your name?", "A party in your inbox"). 본문은 또렷한 산세리프.
- **형태**: 둥근 **pill 버튼**(흰 채움 또는 고스트), 큰 radius 카드, 라운드 **필터 칩**(Trending/Birthday/Dinner…), 글래스모피즘 반투명 카드.
- **CTA 패턴**: 하단 고정 흰색 pill 버튼(Next/Share Flyer/Sign up).
- **세그먼트 칩**: 상단 Upcoming/Hosting 토글.
- **이모지·스티커**를 카피에 적극 섞음 → 캐주얼·감성 톤.
- **사진**: 초대장 커버는 세로/정사각 라운드 카드, 강한 컬러 오버레이.

→ 무드 후보 중 **B. 선명한 네오-팝**(비비드·굵은 타이포·또렷한 대비·경쾌)에 가장 근접. WARA는 이를 **라이트 디폴트 + 한글 타이포 + 다크 동시 지원**으로 재해석한다(영어 레퍼런스 직접 복제 금지).

**글래스모피즘 (라이트 화면 핵심 — GATE 1에서 "최대한 비슷하게" 지시):** Partiful 라이트 화면은 **파스텔 메쉬 그라데이션 배경**(핑크·민트·피치·라벤더가 블러된 블롭으로 섞임) 위에 **반투명 블러 글래스 카드/surface**를 올린다. RSVP·하단 액션은 **원형 글래스 버튼**(이모지+라벨, 반투명). 칩도 반투명 pill. 타이틀("Birthday Bash")은 둥근 디스플레이성 폰트. 풍선·이모지 그래픽 풍부. → WARA 라이트 디폴트의 핵심 언어로 채택: 앱 셸은 차분한 그라데이션/글래스, 초대장은 강한 그라데이션+모션.

---

## B. 무드 & 브랜드 (GATE 1 확정)

- **무드: B 네오-팝 + 글래스모피즘(라이트 재해석)** — 파스텔 그라데이션/글래스 베이스 + 비비드 보라–핑크 포인트, 굵은 한글 디스플레이, pill·글래스 카드 중심. 초대장 템플릿에서 강한 컬러·그라데이션·모션을 허용해 "전역 UI는 차분한 글래스, 초대장은 화려" 대비.
- 브랜드 퍼스낼리티: **설레는 · 또렷한 · 따뜻한 · 캐주얼**
- **메인 컬러는 중립(잉크/화이트/글래스), 컬러 포인트는 그라데이션** (GATE 3 재조정: 보라/핑크 단색을 brand로 쓰지 않음). primary 액션 = 잉크 pill(라이트 블랙/다크 화이트) + 무지개 그라데이션 언더글로우. 그라데이션/사진 위에서는 화이트 pill. 포커스 링·강조도 중립 기반, 화려함은 그라데이션·글래스로만.

---

## C. 컬러 시스템 초안 (역할 중심 시맨틱, 라이트/다크)

> 보라–핑크 확정 기준 초안. Phase 1에서 수치 고정 + 모든 텍스트/배경 쌍 WCAG AA(본문 4.5:1, 큰 텍스트 3:1) 검증.

| 역할 토큰 | Light | Dark |
|---|---|---|
| `--color-background` | `#FFFFFF` | `#0C0A12` |
| `--color-surface` | `#FFFFFF` | `#16131F` |
| `--color-surface-muted` | `#F5F4F8` | `#1F1B2B` |
| `--color-text` | `#14121A` | `#F4F1FA` |
| `--color-text-muted` | `#6B6577` | `#ADA6BD` |
| `--color-text-disabled` | `#A8A3B3` | `#6E6880` |
| `--color-border` | `#ECEAF1` | `#2A2536` |
| `--color-border-strong` | `#D8D4E0` | `#3A3348` |
| `--color-primary` | `#6D3BEB` | `#8B62FF` |
| `--color-primary-strong` | `#5A2BD0` | `#A07BFF` |
| `--color-accent` | `#FF4D8D` | `#FF6FA3` |
| `--color-success` | `#16A34A` | `#34D399` |
| `--color-warning` | `#D97706` | `#FBBF24` |
| `--color-danger` | `#DC2626` | `#F87171` |
| `--color-info` | `#2563EB` | `#60A5FA` |
| `--focus-ring` | `rgba(109,59,235,.35)` | `rgba(139,98,255,.45)` |
| `--color-surface-glass` | `rgba(255,255,255,.60)` | `rgba(28,24,40,.55)` |
| `--color-surface-glass-strong` | `rgba(255,255,255,.78)` | `rgba(32,27,46,.72)` |
| `--color-glass-border` | `rgba(255,255,255,.45)` | `rgba(255,255,255,.12)` |
| `--blur-glass` | `16px` | `18px` |
| `--gradient-app-bg` | 파스텔 메쉬(핑크/라벤더/민트, 저채도) | 딥 보라/마젠타 글로우(저명도) |

규칙: 한 화면에서 강한 포인트 컬러는 최대 2개. 삭제·위험은 항상 `danger`(primary로 쓰지 않음). 초대장 팔레트는 전역 토큰과 **분리**(invite 엔진의 `InvitePalette`). 글래스 surface는 `backdrop-filter: blur(var(--blur-glass))` + 반투명 배경 + `--color-glass-border` 1px로 표현(RSVP·하단 액션·칩·바텀시트).

---

## D. 한글 타이포 스케일 (지시서 §7-2 채택)

기본: `--font-sans: Pretendard`, `--font-display: Pretendard`(템플릿별 display는 invite 엔진에서 오버라이드). `word-break: keep-all; overflow-wrap: anywhere`.

| variant | 크기 | 굵기 | 줄간격 | 자간 |
|---|---:|---:|---:|---:|
| display | 32 | 700 | 1.25 | -0.02em |
| title | 26 | 700 | 1.30 | -0.02em |
| sectionTitle | 22 | 700 | 1.35 | -0.015em |
| cardTitle | 18 | 600 | 1.40 | -0.01em |
| bodyLarge | 17 | 400 | 1.55 | -0.005em |
| body | 16 | 400 | 1.55 | 0 |
| bodySmall | 14 | 400 | 1.50 | 0 |
| caption | 12 | 400 | 1.45 | 0 |
| button | 15 | 600 | 1.20 | -0.005em |
| badge | 12 | 600 | 1.20 | 0 |

## E. 형태·깊이·아이콘

- **radius**: xs 6 / sm 10 / md 14 / lg 20 / xl 28 / full 9999(pill). 버튼·칩은 pill, 카드는 lg~xl.
- **깊이**: 라이트는 부드러운 그림자 + 얇은 보더 + 글래스 블러 병행, 다크는 surface 명도 차로 위계. shadow xs~xl 5단계.
- **글래스**: 반투명 surface + `backdrop-filter` blur + 글래스 보더. RSVP·하단 액션은 원형 글래스 버튼, 칩·바텀시트도 글래스.
- **아이콘: Font Awesome (확정)** — `@fortawesome/react-fontawesome` + free-solid/regular(+ brands). name 기반 registry로 개별 import(트리쉐이킹). 사이즈 토큰 xs12/sm16/md20/lg24/xl32, currentColor 기본. solid를 기본 weight로. 카카오·네이버 등 FA에 없는 브랜드 아이콘은 커스텀 SVG 유지, 구글·애플은 brands.

---

## F. 화면 인벤토리 (13그룹 — `web-redesign-ai-prompt.md` 계승)

인증·온보딩 / 홈·목록 / 초대장 상세(게스트) / 초대장 상세(호스트) / 생성·수정 / RSVP·날짜투표 / 프로필·계정 / 친구 / 알림 / 사진·미디어 / 고객지원 / 어드민 / 공개공유. (감성 강조 High: 상세·템플릿·앨범·공유·온보딩 / 시스템 Calm: 폼·설정·명단·어드민)

## G. 컴포넌트 인벤토리 → 새 아토믹 매핑

| 새 계층 | 컴포넌트 | 기존 대응(참고만) |
|---|---|---|
| `@wara/ui` icons | Icon, registry, IconName, 브랜드 아이콘 | components/icons/* + react-icons 4파일 흡수 |
| `@wara/ui` atoms | Text(신규)·Button·IconButton·Input·Textarea·Avatar(+Group)·Badge·Chip·Divider·Spinner | primitives/* (TextInput→Input, Textarea, Avatar, Badge, Button, IconButton, Chip, Divider, Checkbox/Radio/Switch는 FormField로 흡수) |
| `@wara/ui` molecules | Modal·Drawer(신규)·BottomSheet·Toast·ConfirmDialog·FormField·SearchBar·Tabs(신규)·TopAppBar·BottomNavigation·EmptyState·LoadingState·ErrorState | molecules/* + organisms/{EmptyState,ErrorState,Skeleton} |
| `apps/web` invite 엔진 | InviteTemplateRenderer·Preview·Selector + 4레이어 + preset + registry + 템플릿 10종 | organisms/{InvitationCover,InvitationCard,TemplateCard} 폐기·재설계, globals.css 433~744 배경/애니 폐기 |
| `apps/web` organisms | InviteCard·CommentBox·ParticipantList·GalleryGrid·ProfileSummary·NotificationItem·WeatherCard·KakaoMap·MonthCalendar·DateTimeSelector·RSVPButtonGroup 등 | 동명 organisms 재작성 |
| `apps/web` templates | AppShell·FormPageTemplate·ListPageTemplate·FullScreenTemplate | layout/{PageLayout,StickyCTA,StickyHeader,MainBottomNav} 흡수 |

폐기: `.type-*` 5파일(SectionHeader, InvitationCard 등), react-icons 4파일, globals.css 구 @theme·.theme-dark·초대장 배경/애니, `src/styles/DESIGN.md`.

## H. 초대장 템플릿 10종 기획 (지시서 §9 채택)

| 카테고리 | 템플릿 | background preset | motion preset |
|---|---|---|---|
| birthday | Birthday Dream | pastelGradient | floatingStars, softGlow |
| party | Neon Party | neonGradient | retroPulse, sparkles |
| travel | Sky Trip | skyCloud | paperPlanes, cloudDrift |
| casual | Daily Invite | paperTexture | softGlow |
| y2k | Pixel Pop | retroGrid | sparkles, confetti |
| retro | Retro Night | retroGrid | retroPulse |
| wedding | Soft Garden | seasonalFlower | fallingPetals |
| seasonal | Cherry Blossom | seasonalFlower | fallingPetals |
| graduation(졸업→seasonal) | Memory Blue | skyCloud | softGlow |
| minimal/모임 | Glass Mood | glassAurora | softGlow, sparkles |

각 템플릿 메타: id·name·category·description·palette·typography·layout·background·motion·tags·isAnimated·previewImage.

## I. GATE 1 결정 (확정 완료)
1. 무드: **B 네오-팝 + 글래스모피즘**(라이트 디폴트·한글 재해석, Partiful 글래스 톤 최대한 근접).
2. 브랜드 포인트 컬러: **보라–핑크** (primary `#6D3BEB`, accent `#FF4D8D`).
3. 아이콘: **Font Awesome** (react-fontawesome, name 기반 registry, solid 기본).
4. invite 엔진: **앱 내부 유지** (`apps/web/src/components/invite`, PC 앱 실현 시 추출).
