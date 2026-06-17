# Wara 디자인 시스템 — Luma 기반 (DEPRECATED)

> ⚠️ **이 문서는 구(舊) Luma 기반 디자인 시스템 설명으로, Partiful 기반 라이트 리디자인으로 대체되었습니다.**
> 현재 SoT는 다음을 참고하세요:
> - `docs/design-system/01-direction.md` — 디자인 방향
> - `docs/design-system/02-partiful-reference.md` — Partiful 레퍼런스 (컴포넌트 상세)
> - `docs/design-system/03-component-system.md` — 컴포넌트 인벤토리·레거시 매핑·키보드/접근성·마이그레이션 현황
> - 토큰 SoT: `packages/tokens` (`@wara/tokens`), 컴포넌트 SoT: `packages/ui` (`@wara/ui`)
>
> 아래 내용은 아직 마이그레이션되지 않은 레거시 컴포넌트의 참고용으로만 남겨둡니다.

> 모바일 중심 디지털 초대장 서비스 Wara의 디자인 토큰과 기본 규칙.
> 컬러/타이포그래피 시각 확인: Storybook `Docs/Colors`, `Docs/Typography`

---

## 1. 디자인 방향

Wara는 **Luma 디자인 시스템**을 기반으로 합니다. Clean하고 모던하며, 이벤트에 집중된 UI.

핵심 키워드:

- 라이트 우선 (다크는 `html.theme-dark` 클래스로 지원)
- 클린 / 미니멀
- 모바일 우선
- 크랜베리(Cranberry) 브랜드 포인트
- 큰 사진
- 부드럽게 둥근 카드
- 명확한 CTA
- 짧고 쉬운 문구

Wara는 모든 화면을 과하게 꾸미지 않습니다.
**초대장 상세, 공유 화면**에서 브랜드 컬러를 사용하고,
**로그인, 설정, 참석자 명단, 알림, 폼 화면**은 그레이 기반 시스템 UI로 정리합니다.

---

## 2. 기본 화면 기준

모바일 앱 화면만 디자인합니다.

### 기준 프레임

| 용도 | 기준 크기 |
|---|---:|
| 기본 모바일 | 390 × 844 |
| 작은 모바일 대응 | 360 × 800 |
| 큰 모바일 대응 | 430 × 932 |

피그마 작업은 기본적으로 `390 × 844` 프레임을 기준으로 합니다.

### Safe Area

| 영역 | 값 |
|---|---:|
| 상단 Safe Area | 44px |
| 하단 Safe Area | 34px |
| 기본 좌우 Padding | 20px |
| 좁은 화면 좌우 Padding | 16px |
| 섹션 간격 | 32px |
| 카드 내부 Padding | 16px 또는 20px |

---

## 3. 디자인 원칙

### 3.1 한 화면에는 하나의 주요 행동만 둔다

좋은 예:
- 초대장 만들기 화면 → `다음`
- 초대장 상세 게스트 화면 → `참석 여부 선택하기`
- RSVP 화면 → `응답 제출하기`

나쁜 예:
- 저장, 공유, 수정, 삭제, RSVP를 같은 강도로 배치
- 버튼이 너무 많아서 사용자가 뭘 해야 할지 모르는 화면

### 3.2 CTA는 항상 명확하게 보이게 한다

주요 CTA는 하단 고정 버튼으로 배치하는 것을 기본으로 합니다.

```txt
[콘텐츠 영역]

하단 고정 영역
└─ Primary Button (bg-primary = #333537)
```

예외:
- 홈 화면의 `초대장 만들기`는 FAB 가능 (크랜베리 그라디언트)
- 카드 내부의 작은 액션은 Text Button 가능
- 위험 액션은 절대 Primary 색상을 쓰지 않음

### 3.3 감성은 배경보다 브랜드 컬러 포인트에서 준다

- 배경: White / Gray-50 (매우 연한 그레이)
- 카드: White
- 브랜드 포인트: Cranberry / Yellow / Green
- 강조: 버튼, 배지, 상태 표시

### 3.4 정보 위계는 크기와 간격으로 만든다

1. 글자 크기
2. 굵기
3. 여백
4. 카드 구분
5. 색상 강조

### 3.5 모든 상태 화면을 만든다

- Default / Loading / Empty / Error / Disabled / Permission Required / Login Required / Success

---

## 4. 컬러 토큰

`globals.css`의 `@theme` 블록에 정의된 Luma 기반 값. Tailwind 클래스로 사용.

### 4.1 Gray Scale (Luma 기반)

| 토큰 | 헥스값 | 용도 |
|---|---|---|
| `gray-50` | `#f7f8f9` | 소프트 배경, `bg-background-soft` |
| `gray-100` | `#ebeced` | border, 구분선 |
| `gray-200` | `#dee0e2` | 강한 border |
| `gray-300` | `#d2d4d7` | disabled 배경 |
| `gray-400` | `#b3b5b7` | placeholder |
| `gray-500` | `#939597` | tertiary 텍스트 |
| `gray-600` | `#737577` | secondary 텍스트 |
| `gray-700` | `#535557` | primary-hover 버튼 |
| `gray-800` | `#333537` | **primary 버튼** |
| `gray-900` | `#212325` | 가장 진한 텍스트 |

### 4.2 Cranberry (브랜드 컬러)

| 토큰 | 헥스값 | 용도 |
|---|---|---|
| `cranberry-5` | `#fef4f9` | unread 배경 |
| `cranberry-10` | `#fde2ef` | 배지 배경, soft accent |
| `cranberry-20` | `#fcc6de` | 커버 배경 스워치 |
| `cranberry-30` | `#f98dbe` | FAB 그라디언트 상단 |
| `cranberry-40` | `#f6539d` | — |
| `cranberry-50` | `#f31a7c` | **브랜드 색상** (`--color-brand`) |
| `cranberry-60` | `#d5176d` | brand-hover, 배지 텍스트 |
| `cranberry-70` | `#b6145d` | — |
| `cranberry-80` | `#98104e` | — |
| `cranberry-90` | `#790d3e` | — |

### 4.3 기타 팔레트

- **Blue**: `bg-blue-100 text-blue-500/600` — 지도/장소, QR, 정보성 요소
- **Barney**: `bg-barney-* text-barney-*` — 보조 브랜드 포인트 (퍼플)
- **Green**: `bg-green-50 text-green-600` — 참석 확정, 성공
- **Yellow**: `bg-yellow-50 text-yellow-600` — 미정, HOST 배지
- **Red/Rose**: `bg-red-* text-red-*` — 오류, 삭제, 위험
- **Emerald/Amber**: DateVote 전용 (`circle` / `triangle` 투표 타입)

### 4.4 Semantic Tokens

```css
--color-background: #ffffff;
--color-background-soft: #f7f8f9;
--color-surface: #ffffff;

--color-primary: #333537;         /* near-black, 주요 버튼 */
--color-primary-hover: #535557;
--color-primary-soft: #f7f8f9;

--color-brand: #f31a7c;           /* cranberry-50, 브랜드 포인트 */
--color-brand-hover: #d5176d;
--color-brand-soft: #fde2ef;

--color-text-primary: #131517;
--color-text-secondary: #535557;
--color-text-tertiary: #939597;
--color-text-inverse: #ffffff;

--color-border: #ebeced;          /* gray-100 */
--color-border-strong: #dee0e2;   /* gray-200 */

--color-success: #22c55e;
--color-danger: #ef4444;
```

### 4.5 컬러 사용 규칙

`--color-primary` (near-black)은 주요 버튼에 사용합니다.
`--color-brand` (cranberry)는 브랜드 포인트와 텍스트 링크에 사용합니다.

```txt
한 화면에서 강한 포인트 컬러는 최대 2개만 사용합니다.
```

---

## 5. 타이포그래피

### 5.1 Font Family

```css
--font-sans: "Pretendard", -apple-system, BlinkMacSystemFont,
             "Apple Color Emoji", Inter, Roboto, "Segoe UI",
             "Helvetica Neue", Arial, "Noto Sans", sans-serif;
```

- **Pretendard**: 모든 UI 텍스트 (본문, 제목, 버튼, 캡션)
- Display 폰트 없음. 초대장 제목에도 Pretendard를 사용합니다.

### 5.2 Type Scale

| 역할 | 크기 | 굵기 | 사용처 |
|---|---:|---:|---|
| Display | 32px | 800 | 온보딩 / 스플래시 제목 |
| Heading 1 | 28px | 800 | 화면 메인 제목 |
| Heading 2 | 24px | 700 | 섹션 강한 제목 |
| Heading 3 | 22px | 700 | 카드 제목 |
| Title | 18px | 700 | 섹션 제목 |
| Subtitle | 17px | 600 | 리스트 제목 |
| Body 1 | 16px | 400 | 본문 기본 |
| Body 2 | 15px | 400/600 | 설명 / 리스트 항목 |
| Body 3 | 14px | 400 | 보조 설명 |
| Caption 1 | 13px | 400 | 날짜, 상태, 보조 정보 |
| Caption 2 | 12px | 400 | 배지, 라벨 |
| **Button** | 15~16px | **600** | 버튼 (`font-semibold`) |

**버튼 굵기는 `font-semibold` (600)을 기본으로 합니다.** Luma 기준.

### 5.3 모바일 타이포 규칙

- 본문 텍스트는 최소 14px 이상
- 주요 버튼 텍스트는 15~16px
- 섹션 제목은 18~20px 기본
- 한 화면에서 폰트 크기는 4단계 이하

---

## 6. Spacing

4px 기반 spacing scale. Tailwind 기본 스케일 사용.

| 상황 | 권장 값 |
|---|---:|
| 화면 좌우 padding | 20px |
| 좁은 모바일 좌우 padding | 16px |
| 카드 내부 padding | 16px 또는 20px |
| 버튼 내부 좌우 padding | 16~24px |
| 섹션 간 간격 | 32px |
| 입력 필드 간격 | 12~16px |
| 리스트 아이템 간격 | 8~12px |
| 카드 간격 | 12~16px |

---

## 7. Radius

Luma 기반 radius 토큰.

```css
--radius-xs:   2px;
--radius-sm:   4px;
--radius-md:   6px;
--radius-lg:   8px;
--radius-xl:   10px;
--radius-2xl:  12px;
--radius-3xl:  14px;
--radius-4xl:  16px;
--radius-full: 9999px;
```

| 요소 | 클래스 | Radius |
|---|---|---:|
| 작은 배지 / 칩 | `rounded-full` | 9999px |
| 버튼 / 입력창 | `rounded-xs` | 2px |
| 버튼 (lg) | `rounded-sm` | 4px |
| 사진 썸네일 | `rounded-sm` | 4px |
| 카드 / 정보 박스 | `rounded-md` | 6px |
| 히어로 이미지 / 모달 / 바텀시트 | `rounded-lg` | 8px |

---

## 8. Shadow

Luma DevTools 기반 그림자. 레이어된 미세 그림자 구조.

```css
--shadow-xs: 0 1px 4px rgba(0,0,0,0.10);
--shadow-sm: .../* 5단계 레이어 */;
--shadow-md: .../* 5단계 레이어 */;
--shadow-lg: .../* 5단계 레이어 */;
--shadow-xl: .../* 5단계 레이어 */;
```

| 요소 | Shadow |
|---|---|
| 기본 카드 | shadow-xs 또는 border |
| 떠 있는 카드 hover | shadow-sm |
| FAB 버튼 | 커랜베리 컬러 glow |
| 바텀시트 | shadow-lg |
| 모달 | shadow-xl |

---

## 9. Hover 상호작용

Luma는 transform/scale 대신 bg-color 변화로 hover를 표현합니다.

| 컨텍스트 | Hover 클래스 |
|---|---|
| 일반 interactive (리스트, 버튼) | `hover:bg-gray-50 transition-colors duration-150` |
| 아이콘 버튼 | `hover:bg-gray-100 transition-colors duration-150` |
| 다크 오버레이 위 버튼 | `hover:bg-black/50 transition-colors duration-150` |
| 카드 | `hover:shadow-sm transition-shadow duration-200` |
| FAB | `transition-shadow duration-300` |

`hover-emphasis`, `hover-emphasis-sm`, `hover-emphasis-glass` 유틸리티는 삭제되었습니다.

---

## 10. Border

```css
--color-border:       #ebeced;   /* 기본 구분선 */
--color-border-strong: #dee0e2;  /* 강한 구분선 / focus ring 보조 */
```

- 입력창: 1px `border-border`, focus 시 `ring-1 ring-primary`
- 카드: border 또는 shadow 중 하나만 강하게 사용
- 선택 상태: `border-primary`
- 오류 상태: `border-danger`

---

## 11. 접근성

### 터치 영역
- 최소 터치 영역: 44 × 44px
- 아이콘 버튼 실제 클릭 영역: 44px 이상

### 대비
- 본문 텍스트는 배경과 충분한 대비
- 색상만으로 상태를 구분하지 않음 — 텍스트나 아이콘 병행

### 텍스트
- 버튼 텍스트는 동사로 작성
- 아이콘만 있는 버튼은 `aria-label` 필수

---

## 12. Microcopy 규칙

친근하고 짧게, 감성적이지만 기능을 방해하지 않게.

**좋은 예:**
```txt
초대장 만들기 / 참석할게요 / 링크 복사하기 / 다시 시도하기
```

**피해야 할 예:**
```txt
확인 / 진행 / 처리 / 데이터 전송 / 삭제되었습니다
```

---

## 13. 금지 규칙

```txt
- 픽셀 폰트 사용 (DungGeunMo 등 삭제됨)
- Y2K 스티커 / 레트로 장식 추가
- hover 시 transform/scale 애니메이션 (hover-emphasis 삭제됨)
- bg-invite-* 유틸리티 사용 (삭제됨)
- 한 화면에 Primary Button 여러 개 두기
- 12px 이하 본문 텍스트
- 흐린 배경 위에 흐린 텍스트
- 삭제 버튼을 Primary 색상으로 만들기
- 권한 없는 기능을 설명 없이 실패시키기
- 개발자 용어로 된 에러 메시지 노출
- 버튼 굵기를 font-bold(700)로 쓰기 → font-semibold(600) 사용
- V1.1+ 기능 미리 구현 (DM / AI / 날짜투표 / 이모지 / Album / 체류시간)
```

---

## 14. 빠른 화면 제작 체크리스트

```txt
[ ] 이 화면의 주요 행동이 1개인가?
[ ] 제목, 설명, CTA의 위계가 명확한가?
[ ] 좌우 padding이 16~20px로 통일되어 있는가?
[ ] 버튼 높이가 44px 이상인가?
[ ] 터치 영역이 최소 44px 이상인가?
[ ] 버튼 텍스트가 font-semibold인가?
[ ] Empty 상태가 있는가?
[ ] Loading 상태가 있는가?
[ ] Error 상태가 있는가?
[ ] 포인트 컬러가 최대 2개인가?
[ ] 다크 모드에서도 정상적으로 보이는가? (html.theme-dark)
[ ] 하단 CTA가 safe area에 가려지지 않는가?
```

---

## 15. Wara다운 화면 공식

```txt
White background
+ Rounded card (24~32px)
+ Large photo
+ Cranberry brand point
+ Dark primary CTA button
+ Short Korean microcopy
= Wara UI (Luma Edition)
```

화면이 밋밋하면:
```txt
1. 카드 radius를 24~32px로
2. 섹션 제목을 18~20px Semibold로
3. Primary CTA를 하단에 고정
4. D-day / 상태 배지 추가
```

화면이 지저분하면:
```txt
1. 색상 수 줄이기
2. 카드 개수 줄이기
3. 버튼 수 줄이기
4. 설명 문구 줄이기
```
