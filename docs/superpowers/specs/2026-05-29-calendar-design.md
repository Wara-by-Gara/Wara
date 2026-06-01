# /calendar 화면 설계

> 작성일: 2026-05-29
> 참고: IMG_7959.PNG (Apple Calendar 스타일 월간 뷰). 화면 구성만 참고하고 UI는 WARA 디자인 시스템으로 구현.

## 목표

내 초대장 일정을 월간 캘린더로 한눈에 보고, 선택한 날짜의 일정 상세를 확인한다.

## 범위 (V1.0)

- `eventStartAt`이 설정된 내 초대장(호스트/참석 모두)만 해당 날짜에 표시
- 날짜 미정(투표 중) 초대장은 캘린더에 표시하지 않음
- 상단 컨트롤: 월 이동 + Today 만 (필터/검색은 V1 제외 — YAGNI)
- 일정 표시: 날짜 칸에 초대장 `mainImageUrl` 썸네일 (최대 2~3개)

## 컴포넌트

### MonthCalendar (신규 공용)

`src/components/organisms/MonthCalendar/`. vote의 인라인 `CalendarPicker`에서 월 그리드·요일헤더·월 이동·주말 색상을 추출한 공용 컴포넌트.

```ts
interface MonthCalendarProps {
  year: number;
  month: number;                              // 1~12
  selectedKeys: Set<string>;                  // 'YYYY-MM-DD'
  onDayClick: (key: string) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday?: () => void;                        // 있으면 Today 버튼 노출
  disablePast?: boolean;                       // true면 오늘 이전 비활성 (vote)
  getDayThumbnails?: (key: string) => string[];// 날짜별 일정 썸네일 (calendar)
}
```

- 날짜 키 포맷: `YYYY-MM-DD` (로컬 기준, `padStart`)
- 선택: `selectedKeys` 포함 시 강조. 단일/다중 선택 의미는 부모가 Set으로 관리
- vote: `disablePast=true`, 썸네일/`onToday` 없음, 다중선택
- calendar: 썸네일 + `onToday`, 단일선택, 과거 열람 허용

### Calendar 화면 (신규)

`src/screens/Calendar/Calendar.tsx` (client). `app/calendar/page.tsx`가 렌더 (기존 EmptyState placeholder 교체).

구성 (위→아래):
1. `TopAppBar title="캘린더"`
2. `MonthCalendar` (월 이동 + Today + 썸네일)
3. 선택일 상세 섹션: 헤더 `토요일 5월 2일` + ‹ › (전/다음 날, 달 경계 시 월도 이동) + 해당 날짜 일정 카드 리스트
   - 이벤트 카드(화면 내 단일 사용): 썸네일 + 시간 + 제목 + 역할 배지(`내가 주최`/`참석`), 탭 시 `ROUTES.INVITATIONS.DETAIL(id)` 이동

## 데이터 흐름

- `useMyInvitations()` → `eventStartAt` 있는 것만 필터
- `Map<dateKey, Invitation[]>` 구성 (dateKey = `eventStartAt`의 로컬 날짜)
- 상태: `displayedMonth`(년/월), `selectedDay`(기본=오늘)
- `getDayThumbnails(key)` = 해당 날짜 일정들의 `mainImageUrl`

## 상태 처리

- 선택일에 일정 없음 → "이 날 일정이 없어요" 안내
- 일정 있는 내 초대장이 전혀 없음 → `EmptyState`
- 바텀네비는 `app/layout.tsx`가 전역 제공 (화면에서 별도 X)

## 영향 범위 / 리스크

- 수정: `DateVote.tsx` (`CalendarPicker` 제거 → `MonthCalendar` 사용). **회귀 위험 지점** → 타입체크 + vote 스토리로 검증
- 수정: `app/calendar/page.tsx`
- 신규: `MonthCalendar`(+story), `Calendar` 화면
- API/DB 변경 없음 (기존 `GET /invitations` 재사용)

## 검증

`pnpm typecheck && pnpm lint && pnpm build` 통과. vote 화면 동작 유지 확인.
