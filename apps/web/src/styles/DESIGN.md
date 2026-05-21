# Wara 전체 디자인 규칙

> 모바일 중심 디지털 초대장 서비스 Wara의 전체 디자인 토큰과 기본 규칙.
> 컴포넌트, 아이콘, 페이지별 규칙은 다음 문서를 참고:
> - `src/components/COMPONENTS.md`
> - `src/components/icons/ICONS.md`
> - `src/app/PAGES.md`

---

## 1. 디자인 방향

Wara의 디자인은 **귀엽고 감성적이지만, 사용성이 흐려지지 않는 모바일 UI**를 목표로 합니다.

핵심 키워드:

- 모바일 우선
- Y2K / 레트로 감성
- 픽셀 포인트
- 파스텔 컬러
- 큰 사진
- 둥근 카드
- 명확한 CTA
- 짧고 쉬운 문구
- 초대장다운 설렘
- 모임 후 추억을 남기는 앨범 감성

Wara는 모든 화면을 과하게 꾸미지 않습니다.
**초대장 상세 화면, 템플릿, 앨범, 공유 화면**에서 감성을 강하게 주고,
**로그인, 설정, 참석자 명단, 알림, 폼 화면**은 깔끔한 시스템 UI로 정리합니다.

---

## 2. 기본 화면 기준

모바일 앱 화면만 디자인합니다.

### 기준 프레임

| 용도 | 기준 크기 |
|---|---:|
| 기본 모바일 | 390 × 844 |
| 작은 모바일 대응 | 360 × 800 |
| 큰 모바일 대응 | 430 × 932 |
| 앱스토어 스크린샷 참고 | 1290 × 2796 또는 1179 × 2556 |

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

### 화면 구조 기본값

```txt
Mobile Frame
├─ Status/Safe Area
├─ Top App Bar
├─ Content Area
│  ├─ Section
│  ├─ Card
│  ├─ Form
│  └─ List
├─ Sticky CTA / Bottom Navigation
└─ Bottom Safe Area
```

---

## 3. 디자인 원칙

### 3.1 한 화면에는 하나의 주요 행동만 둔다

좋은 예:

- 초대장 만들기 화면 → `다음`
- 초대장 상세 게스트 화면 → `참석 여부 선택하기`
- RSVP 화면 → `응답 제출하기`
- 앨범 화면 → `사진 올리기`

나쁜 예:

- 저장, 공유, 수정, 삭제, RSVP를 같은 강도로 배치
- 버튼이 너무 많아서 사용자가 뭘 해야 할지 모르는 화면

### 3.2 CTA는 항상 명확하게 보이게 한다

주요 CTA는 하단 고정 버튼으로 배치하는 것을 기본으로 합니다.

```txt
[콘텐츠 영역]

하단 고정 영역
└─ Primary Button
```

예외:

- 홈 화면의 `초대장 만들기`는 FAB 가능
- 카드 내부의 작은 액션은 Text Button 가능
- 위험 액션은 절대 Primary 색상을 쓰지 않음

### 3.3 감성은 배경보다 카드와 포인트에서 준다

전체 배경을 너무 강한 색으로 채우면 모바일 화면이 피곤해집니다.

권장:

- 배경: White / Very Light Pastel
- 카드: White
- 포인트: Pink / Sky / Yellow / Pixel Sticker
- 강조: 버튼, 배지, 섹션 타이틀, 스티커

### 3.4 정보 위계는 크기와 간격으로 만든다

텍스트가 많아질수록 색으로 해결하려 하지 말고, 아래 순서로 위계를 만듭니다.

1. 글자 크기
2. 굵기
3. 여백
4. 카드 구분
5. 색상 강조

### 3.5 모든 상태 화면을 만든다

각 화면은 최소한 아래 상태를 고려합니다.

- Default
- Loading
- Empty
- Error
- Disabled
- Permission Required
- Login Required
- Success

---

## 4. 컬러 토큰

Wara 컬러는 **화이트 기반 + 파스텔 포인트 + 레트로 강조색**으로 사용합니다.

### 4.1 Primitive Colors

```css
--wara-white: #FFFFFF;
--wara-black: #171717;

--gray-50: #FAFAFA;
--gray-100: #F5F5F5;
--gray-200: #EAEAEA;
--gray-300: #D4D4D4;
--gray-400: #A3A3A3;
--gray-500: #737373;
--gray-600: #525252;
--gray-700: #404040;
--gray-800: #262626;
--gray-900: #171717;

--pink-50: #FFF1F7;
--pink-100: #FFE1EF;
--pink-200: #FFC4DF;
--pink-300: #FF9ACA;
--pink-400: #FF6DB3;
--pink-500: #FF4FA3;
--pink-600: #E7358C;

--sky-50: #EEF8FF;
--sky-100: #DDF1FF;
--sky-200: #BDE6FF;
--sky-300: #8DD4FF;
--sky-400: #5BC1FF;
--sky-500: #2EA8F5;

--yellow-50: #FFFBEA;
--yellow-100: #FFF3BF;
--yellow-200: #FFE47A;
--yellow-300: #FFD43B;
--yellow-400: #FAB005;

--mint-50: #EDFFF8;
--mint-100: #D3FBEA;
--mint-200: #A8F0D2;
--mint-300: #6EE7B7;
--mint-400: #34D399;

--red-50: #FFF1F2;
--red-100: #FFE4E6;
--red-500: #F43F5E;
--red-600: #E11D48;

--green-50: #F0FDF4;
--green-100: #DCFCE7;
--green-500: #22C55E;
--green-600: #16A34A;
```

### 4.2 Semantic Colors

```css
--color-background: var(--wara-white);
--color-background-soft: var(--gray-50);
--color-surface: var(--wara-white);
--color-surface-pastel: var(--pink-50);

--color-primary: var(--pink-500);
--color-primary-hover: var(--pink-600);
--color-primary-soft: var(--pink-100);

--color-secondary: var(--sky-400);
--color-secondary-soft: var(--sky-100);

--color-accent: var(--yellow-300);
--color-accent-soft: var(--yellow-100);

--color-success: var(--green-500);
--color-success-soft: var(--green-50);

--color-danger: var(--red-500);
--color-danger-soft: var(--red-50);

--color-text-primary: var(--gray-900);
--color-text-secondary: var(--gray-600);
--color-text-tertiary: var(--gray-400);
--color-text-inverse: var(--wara-white);

--color-border: var(--gray-200);
--color-border-strong: var(--gray-300);

--color-dim: rgba(0, 0, 0, 0.48);
```

### 4.3 컬러 사용 규칙

Primary Pink는 아래에만 사용합니다.

- 주요 CTA 버튼
- 선택된 RSVP 상태
- 핵심 배지
- 활성 탭
- 중요한 포인트 텍스트

Sky Blue는 아래에 사용합니다.

- 정보성 배지
- 지도/장소 관련 요소
- 보조 버튼
- 링크 복사/공유 성공 피드백

Yellow는 아래에 사용합니다.

- D-day
- 이벤트 포인트
- 스티커
- 강조 아이콘 배경

Red는 아래에만 사용합니다.

- 삭제
- 신고
- 나가기
- 오류
- 실패
- 위험 안내

한 화면에서 강한 포인트 컬러는 **최대 2개**만 사용합니다.
예: Pink + Yellow, Pink + Sky

---

## 5. 타이포그래피 토큰

기본 폰트는 `Pretendard`를 사용합니다.
로고나 이벤트 제목 강조에는 픽셀 느낌 폰트를 제한적으로 사용할 수 있습니다.

### 5.1 Font Family

```css
--font-sans: "Pretendard", -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
--font-display: "DungGeunMo", "Galmuri", "Pretendard", sans-serif;
```

### 5.2 Type Scale

| 토큰 | 크기 | 줄높이 | 굵기 | 사용처 |
|---|---:|---:|---:|---|
| Display 1 | 32px | 40px | 800 | 초대장 메인 제목 |
| Display 2 | 28px | 36px | 800 | 온보딩 타이틀 |
| Heading 1 | 24px | 32px | 700 | 화면 메인 제목 |
| Heading 2 | 22px | 30px | 700 | 섹션 강한 제목 |
| Heading 3 | 20px | 28px | 700 | 카드 제목 |
| Title 1 | 18px | 26px | 700 | 섹션 제목 |
| Title 2 | 17px | 24px | 600 | 리스트 제목 |
| Body 1 | 16px | 24px | 400 | 본문 기본 |
| Body 2 | 15px | 22px | 400 | 설명 텍스트 |
| Body 3 | 14px | 20px | 400 | 보조 설명 |
| Caption 1 | 13px | 18px | 400 | 날짜, 상태, 보조 정보 |
| Caption 2 | 12px | 16px | 400 | 배지, 라벨 |
| Button Large | 16px | 22px | 700 | 큰 버튼 |
| Button Medium | 15px | 20px | 700 | 기본 버튼 |
| Button Small | 13px | 18px | 700 | 작은 버튼 |

### 5.3 모바일 타이포 규칙

- 본문 텍스트는 최소 14px 이상 사용합니다.
- 주요 버튼 텍스트는 15~16px을 사용합니다.
- 섹션 제목은 18~20px을 기본으로 합니다.
- 초대장 제목은 24~32px까지 사용할 수 있습니다.
- 한 화면에서 폰트 크기는 4단계 이하로 유지합니다.
- 픽셀 폰트는 긴 본문에 사용하지 않습니다.
- 픽셀 폰트는 로고, 짧은 제목, 배지, 장식 문구에만 사용합니다.

---

## 6. Spacing 토큰

Wara는 4px 기반 spacing scale을 사용합니다.

```css
--space-0: 0;
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;
--space-16: 64px;
```

### 6.1 기본 여백 규칙

| 상황 | 권장 값 |
|---|---:|
| 화면 좌우 padding | 20px |
| 좁은 모바일 좌우 padding | 16px |
| 카드 내부 padding | 16px 또는 20px |
| 버튼 내부 좌우 padding | 16~20px |
| 섹션 간 간격 | 32px |
| 제목과 설명 간격 | 6~8px |
| 입력 필드 간격 | 12~16px |
| 리스트 아이템 간격 | 8~12px |
| 카드 간격 | 12~16px |
| 하단 CTA와 콘텐츠 간격 | 20~24px |

### 6.2 화면 밀도 규칙

- 모바일 화면에서는 세로 여백을 너무 크게 잡지 않습니다.
- 첫 화면에서 핵심 CTA가 보이는 것이 좋습니다.
- 초대장 상세 화면은 감성을 위해 여백을 넉넉히 써도 됩니다.
- 참석자 명단, 댓글, 알림은 정보 밀도가 중요하므로 여백을 줄입니다.

---

## 7. Radius 토큰

Wara는 둥근 형태를 기본으로 사용합니다.

```css
--radius-xs: 4px;
--radius-sm: 8px;
--radius-md: 12px;
--radius-lg: 16px;
--radius-xl: 20px;
--radius-2xl: 24px;
--radius-full: 999px;
```

### Radius 사용 규칙

| 요소 | Radius |
|---|---:|
| 작은 배지 | 999px |
| 입력창 | 12px |
| 기본 버튼 | 14~16px |
| 큰 CTA 버튼 | 16~20px |
| 카드 | 20~24px |
| 초대장 대표 이미지 | 24px |
| 바텀시트 상단 | 24px |
| 모달 | 24px |
| 사진 썸네일 | 12~16px |

Wara에서는 날카로운 사각형을 거의 사용하지 않습니다.
단, 픽셀 장식 요소는 의도적으로 각진 형태를 사용할 수 있습니다.

---

## 8. Shadow 토큰

그림자는 강하게 쓰지 않습니다.
카드가 떠 보이는 정도로만 사용합니다.

```css
--shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.04);
--shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.06);
--shadow-md: 0 6px 16px rgba(0, 0, 0, 0.08);
--shadow-lg: 0 12px 32px rgba(0, 0, 0, 0.12);
```

### Shadow 사용 규칙

| 요소 | Shadow |
|---|---|
| 기본 카드 | shadow-sm |
| 떠 있는 CTA | shadow-md |
| 바텀시트 | shadow-lg |
| 모달 | shadow-lg |
| 사진 카드 | shadow-sm |
| 눌린 버튼 | shadow 없음 또는 inset 효과 |

너무 진한 그림자는 금지합니다.
Y2K 감성은 그림자보다 **컬러, 스티커, 라운드, 픽셀 장식**으로 표현합니다.

---

## 9. Border 토큰

```css
--border-thin: 1px;
--border-medium: 1.5px;
--border-thick: 2px;
```

### Border 색상 규칙

- 기본 구분선: `gray-200`
- 강한 구분선: `gray-300`
- 선택 상태: `primary`
- 오류 상태: `danger`
- 픽셀 장식: `black` 또는 `primary`

### Border 사용 규칙

- 입력창은 기본적으로 1px border를 사용합니다.
- 카드에는 border 또는 shadow 중 하나만 강하게 사용합니다.
- 감성 카드에는 아주 연한 border를 사용하는 것이 좋습니다.
- 픽셀 컨셉 카드에는 2px solid border를 제한적으로 사용할 수 있습니다.

---

## 10. Accessibility 규칙

### 10.1 터치 영역

- 최소 터치 영역은 44 × 44px입니다.
- 아이콘 버튼도 실제 클릭 영역은 44px 이상이어야 합니다.

### 10.2 대비

- 본문 텍스트는 배경과 충분한 대비를 가져야 합니다.
- 연한 파스텔 배경 위에는 진한 텍스트를 사용합니다.
- 색상만으로 상태를 구분하지 않습니다. 텍스트나 아이콘을 함께 사용합니다.

### 10.3 텍스트

- 중요한 정보는 이미지 안에만 넣지 않습니다.
- 버튼 텍스트는 동사로 작성합니다.
- 아이콘만 있는 버튼은 의미를 알 수 있게 라벨을 설정합니다.

---

## 11. Writing / Microcopy 규칙

Wara의 문구는 부드럽고 친근하지만 과하게 유치하지 않게 작성합니다.

### 11.1 톤

- 친근함
- 짧고 명확함
- 모바일에서 읽기 쉬움
- 감성적이지만 기능을 방해하지 않음

### 11.2 버튼 문구

좋은 예:

```txt
초대장 만들기
참석할게요
응답 제출하기
사진 올리기
링크 복사하기
다시 시도하기
```

피해야 할 예:

```txt
확인
진행
처리
데이터 전송
```

### 11.3 Empty 문구

```txt
아직 사진이 없어요
모임의 첫 사진을 올려보세요
```

### 11.4 Error 문구

```txt
잠시 문제가 생겼어요
다시 시도하면 해결될 수 있어요
```

사용자를 탓하는 문구는 사용하지 않습니다.

---

## 12. 빠른 화면 제작 체크리스트

새 화면을 만들 때 아래를 확인합니다.

```txt
[ ] 이 화면의 주요 행동이 1개인가?
[ ] 제목, 설명, CTA의 위계가 명확한가?
[ ] 좌우 padding이 16~20px로 통일되어 있는가?
[ ] 버튼 높이가 48px 이상인가?
[ ] 터치 영역이 최소 44px 이상인가?
[ ] 카드 radius가 20~24px로 통일되어 있는가?
[ ] 텍스트 크기가 너무 작지 않은가?
[ ] Empty 상태가 있는가?
[ ] Loading 상태가 있는가?
[ ] Error 상태가 있는가?
[ ] 권한별 차이가 반영되어 있는가?
[ ] 하단 CTA가 safe area에 가려지지 않는가?
[ ] 색을 너무 많이 쓰지 않았는가?
[ ] 한 화면의 포인트 컬러가 2개 이하인가?
[ ] 실제 모바일에서 한 손으로 누르기 쉬운가?
```

---

## 13. 금지 규칙

아래는 피합니다.

```txt
- 한 화면에 Primary Button 여러 개 두기
- 모든 화면을 과하게 Y2K로 꾸미기
- 본문에 픽셀 폰트 사용하기
- 12px 이하의 작은 본문 사용하기
- 흐린 파스텔 위에 흐린 텍스트 사용하기
- 아이콘 스타일 여러 개 섞기
- 카드마다 radius 다르게 쓰기
- 버튼 높이를 40px 이하로 만들기
- Empty State에 "데이터 없음"만 쓰기
- 오류 메시지를 개발자 용어로 보여주기
- 삭제 버튼을 Primary 색상으로 만들기
- 권한 없는 기능을 설명 없이 실패시키기
```

---

## 14. Wara다운 화면을 만드는 공식

```txt
White background
+ Rounded card
+ Large photo
+ Pastel point color
+ Clear CTA
+ Small pixel sticker
+ Short Korean microcopy
= Wara UI
```

화면이 밋밋하면:

```txt
1. 카드에 radius 24px 적용
2. 섹션 제목을 18~20px Bold로 키우기
3. Primary CTA를 하단에 고정
4. D-day나 상태 배지를 추가
5. 작은 픽셀 별/하트 스티커 1~2개만 추가
```

화면이 지저분하면:

```txt
1. 색상 수 줄이기
2. 카드 개수 줄이기
3. 버튼 수 줄이기
4. 설명 문구 줄이기
5. 아이콘 장식 줄이기
```

---

## 15. MVP Figma Production Order

### Step 1. Foundation

```txt
1. 컬러 토큰
2. 타이포그래피
3. 버튼
4. 입력창
5. 카드
6. 앱바
7. 바텀시트
8. 모달
9. 토스트
10. Empty State
```

### Step 2. Core Flow

```txt
1. 온보딩
2. 로그인
3. 홈 Empty
4. 홈 Filled
5. 초대장 카드
6. 초대장 만들기
7. 템플릿 선택
8. 초대장 상세 - 게스트
9. RSVP 선택
10. RSVP 완료
11. 초대장 상세 - 호스트
12. 참석자 명단
13. 공유 바텀시트
```

### Step 3. After Event Flow

```txt
1. 앨범 Empty
2. 앨범 그리드
3. 사진 업로드
4. 사진 상세
5. 댓글 Empty
6. 댓글 목록
7. 댓글 작성
```

### Step 4. Support Flow

```txt
1. 알림 패널
2. 지도 전체보기
3. 마이페이지
4. 설정
5. 권한 안내
6. 에러 화면
7. 로딩 화면
```

---

## 16. Screen Quality Checklist

각 화면을 완성한 뒤 아래 기준으로 점검합니다.

```txt
[ ] 이 화면의 목적이 3초 안에 보이는가?
[ ] 사용자가 해야 할 주요 행동이 1개로 보이는가?
[ ] Primary Button이 화면에서 가장 명확한가?
[ ] 날짜, 장소, 참석 여부 같은 핵심 정보가 바로 보이는가?
[ ] 게스트와 호스트 UI가 섞이지 않았는가?
[ ] Empty / Loading / Error 상태가 준비되어 있는가?
[ ] 권한이 필요한 액션에 안내가 있는가?
[ ] 하단 버튼이 Safe Area에 가려지지 않는가?
[ ] 터치 영역이 최소 44px 이상인가?
[ ] 한 화면에서 포인트 컬러를 2개 이하로 사용했는가?
[ ] 장식 아이콘이 기능 아이콘처럼 보이지 않는가?
[ ] 텍스트가 너무 길지 않은가?
[ ] 실제 모바일 크기에서 답답하지 않은가?
```

---

## 17. 최종 기준

Wara 디자인에서 가장 중요한 것은 예쁜 장식이 아니라 **초대받은 사람이 바로 이해하고 행동할 수 있는 것**입니다.

우선순위는 아래와 같습니다.

```txt
1. 사용자가 뭘 해야 하는지 명확한가?
2. 날짜와 장소가 바로 보이는가?
3. RSVP가 쉽게 가능한가?
4. 호스트가 참석자를 쉽게 관리할 수 있는가?
5. 모임 후 사진과 댓글을 자연스럽게 남길 수 있는가?
6. Wara만의 감성이 느껴지는가?
```

예쁜 화면보다 먼저 **헷갈리지 않는 화면**을 만들고,
그 위에 Wara의 파스텔, 픽셀, Y2K 감성을 얹습니다.

---

## 18. Final Note

Wara의 디자인은 아래 순서를 지키면 빠르게 예뻐집니다.

```txt
1. 흰 배경을 깐다.
2. 카드를 둥글게 만든다.
3. 사진을 크게 둔다.
4. CTA를 하단에 명확히 둔다.
5. 상태 배지를 추가한다.
6. 픽셀/스티커 장식은 1~2개만 넣는다.
7. Empty, Loading, Error를 빼먹지 않는다.
```

가장 중요한 화면은 `초대장 상세 - 게스트`입니다.
이 화면이 예쁘고 이해하기 쉬우면 Wara 전체 서비스의 인상이 좋아집니다.
