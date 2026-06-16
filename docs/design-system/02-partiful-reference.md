# Partiful 레퍼런스 전수 분석 (iOS Oct 2025, 234장)

> `docs/design-refs/Partiful ios Oct 2025 {N}.png` (N=0~233) 전부를 1장씩 확인해 기록.
> 목적: 컴포넌트 전면 재설계의 SoT. 화면별로 레이아웃·컴포넌트·색·타이포·모션을 기록.

## 전역 인상 (요약 — 상세는 맨 아래 "종합" 참조)
- **다크 기본** + 이벤트는 풀블리드 테마 배경 + 비눗방울 Effect
- **블루 링크 + 무지개는 포인트(버튼 하단 글로우)**, 단색 핑크/보라 brand 아님
- Primary = **배경 명도 반전**(다크=화이트/라이트=블랙) 둥근 버튼
- **아바타 = 그라데이션 모노그램**, **RSVP = 글래스 원**
- 하단 탭바 = 아이콘 3~4개(라벨X, FAB X)
- 초대 커스터마이즈 = **Theme × Font × Effect 3축**
- → 자세한 격차/조치: 맨 아래 표

---

## 화면별 기록

### 0–9 · 스플래시 & 온보딩/인증

- **0 스플래시**: 순수 블랙 배경. 중앙에 메탈릭 3D 크롬 블롭 "P" 로고 + "partiful" 메탈릭 그라데이션 워드마크.
- **1 추억 리캡(온보딩 인트로)**: 파티 사진 콜라주(메이슨리)가 풀스크린. 위에 글래스 칩들이 떠다님 — `🔥 15`, 흰 `Skip` 알약, `irene +1 · posted 12 photo` 글래스 바, `🥂 12` 칩, 크게 기울어진 글래스 말풍선 카드 "Can't wait for the next one 😍🔥", 😍 스티커. → 추억/앨범이 핵심 감성.
- **2 랜딩(Get started)**: 사진형 노을(핑크→퍼플) 배경 + 떠다니는 풍선·핑크 오브·바닥 컨페티. 중앙 메탈릭 3D P 로고. 하단 **풀폭 화이트 둥근사각 버튼 "Get started"** + 작은 법적 고지. (※ 버튼은 pill이 아니라 radius~14 둥근 사각형, 글로우 없음 — 글로우는 다른 화면)
- **3 전화 인증(Join the party)**: 블랙+상단 퍼플 그라데이션. 흰 굵은 헤딩 + 회색 서브. 국가코드 드롭다운 + 전화번호 입력(다크 필드 #1c1c1e, 얇은 보더). 하단 **풀폭 "Send code" — 비활성=회색**. iOS 숫자 키패드.
- **4**: 번호 입력됨 → 필드 우측 체크, **"Send code" 화이트(활성)**.
- **5 OTP(Verify your phone)**: 다크. `000000` 플레이스홀더 단일 필드. "Resend it in 25s". 하단 **"Next" 비활성 회색**.
- **6**: 코드 입력됨 → 체크, **"Next" + 인라인 스피너(로딩)**.
- **7 이름 입력**: First/Last name 라벨 + 다크 입력 2개. "Next" 비활성 회색.
- **8**: Sam/Lee 입력 → **"Next" 화이트 활성**.
- **9 프로필 사진**: 큰 원형 아바타 플레이스홀더(회색 실루엣 + **파란 글로우 링**) + 카메라 배지(블루-퍼플 그라데이션 원). "💡 Pro tip" 다크 콜아웃 카드. "Next" 비활성.

**이 구간 패턴**
- 인증/온보딩 화면 = **블랙 배경 + 상단 모서리 은은한 퍼플/마젠타 그라데이션**.
- 헤딩: 흰색 굵게(~26–28px), 서브: 회색.
- 입력 필드: 다크(#1c1c1e계열) + 얇은 보더, 라벨은 위쪽 작은 회색.
- **Primary 버튼**: 풀폭·하단 고정. 비활성=회색 / 활성=**화이트+검정 텍스트**, radius~12–14, 로딩=인라인 스피너.
- Skip = 우상단 흰 텍스트.

### 10–19 · 생일·연락처·홈·이벤트 상세

- **10/11 생일 입력**: 다크 + 파티클. 흰 헤딩 "Add your birthday". 다크 필드에 날짜. iOS 휠 피커(하단). "Your birth year is kept private" ⓘ. **"Done" 화이트 풀폭**.
- **12 연락처 동기화**: 블랙. 중앙 손그림 전화기 일러스트 + 주변에 떠 있는 아바타/전화 이모지 **버블들(컬러 글로우 원)**. "Continue" 화이트 풀폭.
- **13/14 홈(빈 상태)**: 상단 퍼플 그라데이션→블랙. 좌상단 작은 P 로고, 우상단 **벨·채팅 아이콘**. "Welcome to Partiful, Sam!" 흰 굵은 헤딩. "Need inspo? **Ask the Party Genie**"(Party Genie=블루 링크). 필터 칩(Upcoming/Hosting/Open invite/Attended, count 포함, 선택 칩=밝은 배경+보더). **대시 보더 New-event 카드**(테마 이미지 미리보기 + 흰 "+ New event" 알약). 하단 탭바=**아이콘 3개(홈 / ⊞ 만들기 / 프로필)**.
- **15/16 홈(이벤트 있음)**: 가로 스크롤 이벤트 카드. 카드=큰 이미지 + 좌상단 **날짜 알약**("Sat 8/30 · 9pm ET" / "TBD") + 우상단 `…` 원형 메뉴 + 우하단 **"HOSTING" 글래스 배지(👑)**. 카드 아래: 굵은 제목 + "Hosted by [그라데이션 아바타] Sam Lee". 다음 카드가 살짝 보임.
- **17/18 이벤트 상세(호스트)**: **테마 컬러 메쉬 그라데이션 배경(핑크/그린) + 떠다니는 비눗방울(시그니처 모션)**. 상단 back/공유/`…`. **초대형 굵은 블랙 제목 "Birthday Bash"**. 정사각 사진(풍선). "Saturday, Aug 30 / 9:00pm–12:00am". 타임존 칩 ET(채움)·ICT(외곽). 하단 **플로팅 글래스 알약 툴바**: Edit · Text Blast · **[1 Going 중앙=흰 원 강조]** · Invite · More. 그 뒤에 실제 탭바.
- **19 이벤트 상세 스크롤(정보 행)**: 아이콘+텍스트 행들 — 👑 Hosted by [SL] Sam Lee / 📍 Central Park, New York, NY (+우측 원형 지도핀 버튼) / 💲 $10 suggested / 👥 25/25 spots left / ✈ Bring your friends (+우측 "Invite" 알약) / ⏳ RSVP by Saturday at 12:59pm / 🎉 Party(드레스코드) / 본문 "Wear your best outfit and snacks!" / "✏ Open Invite | All Hosts' Mutuals ▾" 드롭다운 / **RSVP 글래스 원들(하트)**. 행 구분선 없음(테마 배경 위 투명).

**이 구간 핵심**
- **이벤트/초대 화면 = 테마 컬러 메쉬 풀블리드 배경 + 비눗방울 모션 + 블랙 볼드 텍스트**. (앱 크롬은 블랙)
- **아바타 = 사용자별 비비드 그라데이션 원 + 모노그램**(SL 등). 회색 아님.
- 정보 행: 얇은 라인 아이콘 + 텍스트, 구분선 없이 간격으로 분리.
- 칩: 알약, 선택=채움/미선택=외곽선, count·이모지 동반.
- 호스트 액션 = 하단 **글래스 알약 툴바**(중앙 강조 원).
- 홈 탭바 = **아이콘 3개**, FAB·라벨 없음.

### 20–29 · 이벤트 상세(호스트) · 텍스트블라스트 · 게스트 관리

- **20 이벤트 상세(호스트, RSVP)**: **RSVP = 큰 프로스티드 글래스 원 3개**(Going/Maybe/Can't Go, 하트 이모지, 그라데이션 틴트). "Open Invite | All Hosts' Mutuals ▾". **Photo Album** 섹션(우측 "🔗 Share album" 알약 + Capture/Upload 글래스 타일 2개). **Activity**(2 updates: 그라데이션 아바타 + 이름 + "rsvped Maybe/Going" + 시간 + 💬 Reply). 하단 글래스 툴바.
- **21 텍스트블라스트(빈)**: 라이트 테마 bg. "Auto-Reminders" 토글 Off + 회색 안내. "Your Text Blasts" / 😅 "You have no guests to message yet". 탭바 3개.
- **22 텍스트블라스트(설정됨)**: Auto-Reminders **ON**(검정 토글) + 반투명 카드 2블록: "Reminders to RSVP · 2 weeks/1 week/1 day before · To [Invited][Maybe]", "Event Reminders · 2 hours before · To [Going]". "Send up to 10" + **블랙 "+ New Blast" 알약**.
- **23–25 Compose(블라스트 작성)**: Cancel / Compose / **Send(블루/퍼플 텍스트)**. "To: [✓Going n][✓Maybe n][Can't Go n]" 토글칩 + "Select all/De-select all". "Also show in activity feed" **체크박스(둥근 사각, 체크 시 검정)**. Message textarea + 글자수 `0/480`. 사진 첨부 타일. 25=작성됨 Send 활성.
- **26 블라스트 목록**: 발송 카드 행(제목 + 시간 + "Sent to Going, Maybe" + ›). 하단 **블랙 플로팅 "New Blast"**.
- **27 메시지 상세**: 메시지/시간/"Sent to ...", "Show in activity feed" 토글, Recipients(2) **그라데이션 아바타 AS·JD**, Responses(0).
- **28/29 게스트 관리**: 🔍 검색 + "⇅ Status ▾" 정렬 드롭다운(알약). 필터칩 👍Going1/🤔Maybe0/❤️Invited1. 게스트 행=그라데이션 아바타 + 굵은 이름 + **상태 드롭다운 알약(이모지+라벨+▾)**. "Only visible to hosts" 구분 라벨.

**이 구간 핵심**
- **Primary 버튼은 배경의 반전색**: 라이트 테마 bg 위=**블랙 알약**(New Blast), 다크 위=화이트. → 단순 "흰버튼"이 아니라 명도 대비.
- 체크박스=둥근 사각(체크 시 검정 채움), 토글=iOS 스위치(ON 검정).
- Send/링크성 액션=블루/퍼플 텍스트.
- 칩=이모지+라벨(+count), 선택 시 체크/채움.
- RSVP는 **글래스 원** (사각 버튼 아님 — 내 구현 오류 확인).

### 30–39 · 게스트 관리(정렬/상태/내보내기/체크인)

- **30 정렬 시트**: 라이트 시트(그래버) — Name / Date(Ascending) / Date(Descending) / **Status(✓)**.
- **31** Date 오름차순 적용 상태.
- **32 게스트 상태 변경 시트**: ❤️Invited(✓) / 👍Going / 🤔Maybe / 😣Can't Go / **❌ Remove(빨강)**.
- **33 표시이름 편집 시트**: Cancel / "Edit Display Name" / **Confirm(퍼플)**. 큰 그라데이션 아바타(JD) + 이름 입력. 키보드.
- **34** 상태 갱신 반영.
- **35 일괄 작업 시트**: "Download CSV" / "Check in guests" (아이콘 행).
- **36 게스트 목록 내보내기 시트**: 상태별 **체크박스**(👍Going1✓ / 🤔Maybe1✓ / 🥲Can't Go0) + "Include questionnaire responses" 토글 + **블랙 "⬇ Download CSV" 풀폭**.
- **37** 다운로드 중(버튼 회색 + 스피너 "Downloading").
- **38/39 체크인**: 그라데이션 아바타 + 이름 + 상태(👍Going). 우측 **"Check in" 외곽 알약** → 체크 시 **검정 원형 체크 아이콘**. (40: 체크 해제 시트 = 아바타 + 블랙 "Undo check-in" + 텍스트 "Nevermind")

**이 구간 핵심**
- 바텀시트: 라이트/프로스티드, 그래버, 제목 가운데, 행=이모지/아이콘. Confirm=퍼플 텍스트, 파괴적(Remove)=빨강, 주 액션=**블랙 풀폭 알약**.
- 리스트 체크박스=둥근 사각 블랙체크. 체크인 토글=외곽 알약↔블랙 원형 체크.
- 아바타는 전 화면 일관되게 **그라데이션 모노그램**.

### 40–49 · 초대(연락처/이메일/Compose)

- **40 체크인 해제 시트**: 아바타 + 블랙 "Undo check-in" + 텍스트 "Nevermind".
- **41 초대 랜딩**: 🐣 "Invite Contacts or Share Link" + **블랙 "Add contacts"**. 하단 **원형 아이콘 액션 행**: Copy Link(다크 원) · Messages(**그린 원**) · Email Invite(다크 원) · More(외곽 원) — 각 라벨 동반.
- **42/43 연락처 선택**: 검색 + "Phone contacts"/"⊟ Filter by event" 알약. 행=전화 아이콘 아바타 + 이름/번호 + **체크박스(우)**. 선택 시 "1 Selected" + **블랙 "Next"**.
- **44/45 Compose(초대)**: Message 템플릿 "Hey [Name], Sam Lee invited you to Birthday Bash!" + (선택)커스텀 노트 필드 + "RSVP at [link]". Invitees(1)=아바타+이름+✕. Cancel / **블랙 "Send invites"**. 글자수 카운터.
- **46**: 이벤트 상세에 **토스트 알약 "❤️ Invite sent!"**(제목 근처 떠 있음).
- **47–49 Email Invite**: 탭 "Add email"(언더라인 활성) / "Bulk add". Email + Name(optional) 다크 필드 + **블랙 "Add guest" 알약**. Invitees 목록(아바타+이메일+✕). 하단 "Next" 비활성 회색→블랙.

**이 구간 핵심**
- 공유 액션 = **원형 아이콘 버튼 + 라벨**(Messages=그린).
- 탭 = 언더라인 스타일.
- 인라인 추가 버튼("Add guest") = 작은 블랙 알약.
- 토스트 = 떠 있는 둥근 알약(이모지 포함).

### 50–59 · Compose(이메일)·공유·Bulk add

- **50/51 Compose(이메일)**: 블랙 "Send emails" 풀폭.
- **52**: 발송 후 **"✓ Sent!" 회색 비활성** 상태.
- **53 공유 시트**: "Sending to someone? It looks way better when you share it 😅". **초대 카드 미리보기 캐러셀**(RSVP to Birthday Bash / partiful.com) + "🔗 Tap to copy" + 도트 페이저 + 원형 공유 버튼(Copy Link/Messages 그린/More). 하단 배너 "Get featured on Party Genie · Submit"(외곽 알약).
- **54 Share Flyer**: 플라이어 이미지(제목/날짜 + **QR 코드**) + Save/Messages/More + 캐러셀.
- **55–57 Email Invite·Bulk add 탭**: textarea "Separate multiple emails with semicolons, commas, or new lines" + **블랙 "Add guests"**. Invitees(2)=그라데이션 아바타 + 이메일 + ✕.
- **58/59 Compose(2명)**: Send emails → "✓ Sent!".

**이 구간 핵심**: 공유 = 카드/플라이어 캐러셀(+QR) + 원형 액션. 완료 상태 = "✓ Sent!" 회색 버튼.

### 60–69 · 이벤트 액션시트·설문응답·테마 에디터·플라이어·캘린더

- **60 이벤트 액션 시트(라이트)**: ⚙ Event Settings / 📋 Questionnaire / ⊞ Clone Event / 📄 Make Flyer / 📅 Cancel event(빨강).
- **61/62 설문 응답**: 상단 질문 칩 + 😶 빈 상태 / 응답 테이블(아바타+이름 | 답변 "Yes"). 노란 테마 bg.
- **63 ⭐ 테마 에디터(Edit Event)**: "Edit Event / Done(블루)". **편집 가능한 대형 제목 + 폰트 스타일 칩: Classic / Eclectic / Fancy(필기체) / Simple**(=타이포 프리셋을 사용자 선택). 사진 + ✏ 편집. "Set a date… ▾". 하단 **글래스 툴바: Theme(🔴NEW) / Effect / Settings**. 호스트 행 + "+ Add cohosts".
- **64 플라이어 풀스크린**: Cancel/Flyer/⬇. 테마 프레임 + 사진 + 제목 + partiful 워터마크. "Post this flyer ... tag @partiful!" + 블랙 "Share flyer".
- **65 홈 이벤트 컨텍스트 메뉴(다크 시트)**: Copy link / Sync to calendar / Mute event / Cancel event(빨강). → **시트 테마가 화면 테마를 따름**(홈=다크 시트).
- **66 캘린더 동기화 시트(다크)**: "Use Gcal / Use iCal" 카드 + "+ Add 'Birthday Bash' only".
- **67 단일 추가 시트(다크)**: Apple / Google / Outlook 캘린더 행(앱 아이콘).
- **68 Mute 확인**: **iOS 네이티브 알럿 스타일**(가운데) Cancel(블루)/Mute(빨강).
- **69**: 컨텍스트 메뉴 "Unmute event".

**이 구간 핵심**
- **타이포 = 사용자 선택 폰트 스타일(Classic/Eclectic/Fancy/Simple)** — 초대장 제목 글꼴 토글.
- 테마 에디터 하단 **글래스 툴바 Theme/Effect/Settings**가 편집의 중심.
- **시트/메뉴 테마는 화면 테마를 따른다**(다크 화면=다크 시트, 라이트 테마 이벤트=라이트 시트).
- 파괴적 확인은 iOS 네이티브 알럿(빨강 강조)도 사용.

### 70–79 · 취소 플로우·홈(그리드/리스트)·검색·Stay Connected

- **70/71 이벤트 취소 시트(다크)**: "Cancel event? / This action cannot be undone" **경고 카드(빨강 보더 + 🧨)** + 메시지 템플릿 + 커스텀 노트. **RED "Cancel & notify guests"** + 블랙 "Keep partying".
- **72**: 홈 상단 **"Canceled" 토스트 알약** + 카드에 **"CANCELED" 그라데이션 배너 오버레이**.
- **73 홈(생성 유도)**: "Create an event" + **부채꼴로 펼쳐진 템플릿 카드들** + "🪩 Get inspo" 외곽알약 + **화이트 "+ Create event"**. "👋 An easier way to browse" 다크 배너.
- **74 홈 리스트 뷰**: "This Month · August" 섹션 헤더 + 이벤트 **행**(썸네일 + 날짜 알약 + 제목 + "You · 👑 Hosting"). 좌측 필터행 아이콘으로 **그리드/리스트 뷰 토글**.
- **75/76 이벤트 검색(다크)**: 검색 필드 + 결과 행(썸네일 + 상태 알약[Canceled/TBD] + 제목 + "🪄 Open Invite"). 탭바 4개(홈/+/갤러리/프로필).
- **77 Movie N1ght 상세**: 연파랑 종이질감 테마 bg, 대형 제목, 사진, "Date & Time TBD", 호스트, RSVP 글래스 원, 글래스 툴바.
- **78 홈 푸터 "Stay Connected"**: Become an insider / The Guest List / Instagram / TikTok / Twitter — 다크 리스트 행 + ↗ 외부링크.
- **79 이메일 구독**: "A party in your inbox" + Email 다크 필드 + **"Sign up" 버튼(하단 무지개 언더라인 글로우)**.

**이 구간 핵심**
- **파괴적 주요 액션 = RED 버튼**(취소·알림). 보조 = 블랙.
- 홈은 **그리드 ↔ 리스트 뷰 토글**, 섹션 헤더(월/TBD)로 그룹.
- 카드 상태 오버레이("CANCELED" 배너), 상단 토스트 알약.
- 탭바 아이콘 수 가변(3~4): 홈/만들기/(갤러리)/프로필.
- "Sign up" 화이트 버튼의 **무지개 언더라인 글로우** = 내가 참고한 그 버튼 ✔ (단 앱은 다크 기본).

### 80–89 · 알림·DM/인박스·채팅

- **80/81 홈 이메일 구독**: "Sign up"(무지개 언더라인) / "Done" 비활성 회색.
- **82 알림(빈)**: 다크, 헤더 + 상단 퍼플 그라데이션, 본문 블랙.
- **83 알림(리스트, 다크)**: 행 = **그라데이션/사진 아바타 + 리치 텍스트(볼드 이름·이벤트명) + 날짜 + 우측 썸네일**. 유형: commented("Can't wait!" 인용), **cohost request(이벤트 카드 임베드 "Birthday Bash · 3 Went")**, responded, reacted 😄, replied("Absolutely!").
- **84 인박스(DM)**: **"Boops" 행**(추천 유저: 원형 아바타 + 이름 + "Suggested") + "Messages" 섹션 + 😬 "Your inbox is empty" + **화이트 "New message"(무지개 언더라인)**.
- **85 새 메시지 시트(다크)**: "🔍 Find a Mutual" + 👻 "No Mutuals Yet".
- **86**: 뮤추얼 목록(아바타 + 이름 + "N shared events").
- **87–89 채팅 인트로(Sam Alex, 다크)**: 가운데 아바타 + "You both RSVP'd to ...", **"View profile" + "Boop" 외곽 알약**, "Invite Sam to chat · 한 번만 메시지 가능 · Community Guidelines(블루)". 하단 **채팅 입력 바**(둥근 알약 + 이모지 + 입력) → 텍스트 입력 시 **우측 원형 전송 버튼(블랙 원 + 흰 ↑)**.

**이 구간 핵심**
- 알림/DM = **다크 리스트**. 알림 행 = 아바타 + 리치텍스트 + 시간 + 썸네일(+이벤트 카드 임베드).
- **Boop(콕 찌르기)** 기능, 뮤추얼 기반 1:1 메시지.
- 채팅 입력 = 둥근 알약 + 이모지, 전송 = **블랙 원형 ↑**.

### 90–99 · 채팅·프로필·Boop·이벤트 생성(AI vibe/스크래치)

- **90 채팅(전송 후)**: **보낸 말풍선 = 퍼플/바이올렛 둥근 버블** "Hey!", 날짜/시간 라벨, "Invite sent · 수락 후 계속 대화 가능".
- **91/92 유저 프로필(다크 + 컨페티)**: 아바타(풍선 장식) + 이름 + bio + "📷 instagram핸들". **"Boop"(다크 외곽) + "Message"(화이트)** 버튼. "🎂 August birthday · ☀ Joined Aug '24". **업적 배지(홀로그래픽 스티커형)**. "Shared Events" 카드 그리드.
- **93 Boop 피커 시트(다크)**: 카테고리 칩(Bday/Seasonal/Say hi/XOXO/Plans) + **이모지 boop 그리드**(😘🎁🎈🧑🎂) + "🎁 Pick your own".
- **94 Boop 후**: "You Booped Sam with 😘 · Unopened · Sent <1m ago".
- **95/96 이벤트 생성(AI vibe)**: "What's your party vibe?" + vibe 칩(🔥trending/🎂birthday/🌀chaos/😌chill/👯besties) + **AI 추천 이벤트 카드 미리보기** + "Randomize"(bg따라 화이트/블랙) + "✨ Or create from scratch". 풀블리드 테마 bg.
- **97–99 New Event(스크래치)**: 인라인 편집 제목 "Untitled Event"→"Birthday Bash" + 폰트칩 Classic/Eclectic/Fancy/Simple + 일러스트 테마(라인아트) + "Set a date… ▾" + Theme/Effect/Settings 툴바.

**이 구간 핵심**
- 프로필 = **다크 + 장식(컨페티/풍선) + 홀로그래픽 업적 배지 + 인스타 연동 + Shared Events**.
- **Boop** = 카테고리별 이모지 피커.
- 생성 진입 = **AI "party vibe" 추천**(vibe 칩 + Randomize) 또는 스크래치.
- 보낸 채팅 버블 = 퍼플.

### 100–109 · 생성 폼(상세)·커버 이미지 피커

- **100/101 생성 폼**: 상단 Cancel/New Event/Save(블루). "Set a date… ▾", 정보 행(👑Hosted by + 아바타 + Add cohosts / 📍Location / 👥Unlimited spots / 💲Cost per person / ✈Guests can invite friends[토글] / ⏳RSVP Deadline). **칩: +Link +Playlist +Registry +Dress code +Food situation**. 설명. "More to say? +New section". "Open Invite · Turned Off". "⚙ RSVP Options Select… ▾" + RSVP 글래스 원. **"Quick actions for hosts": Add Questionnaire / Reminders / Require Guest Approval / ··· More(아이콘 외곽 알약)**. 하단 Theme/Effect/Settings 툴바.
- **102** 홈(아바타 SL 그라데이션 반영).
- **103** 제목 폰트 "Fancy"(필기체) 선택.
- **104–108 커버 이미지 피커**: "🔍 Find an image…" + **카테고리 칩(Trending/Birthday/Elegant/Minimal)** + **타입 탭(Posters / GIFs / Photos)** + 그리드. Photos는 "by [작가]" 출처 표기(언스플래시형). **블랙 "⬆ Upload image" 플로팅**.
- **109** 선택 이미지 반영된 생성 폼.

**이 구간 핵심**
- 생성 폼 = 정보 행(아이콘+라벨+값/토글) + 추가 옵션 칩 + Quick actions 외곽 알약 + 하단 Theme/Effect/Settings.
- **커버 = 검색 + 카테고리칩 + Posters/GIFs/Photos 탭 + 업로드** (사진 출처표기).
- 제목 글꼴 토글(Classic/Eclectic/Fancy/Simple)로 분위기 전환.

### 110–119 · 날짜/시간 피커·타임존·장소 피커

- **110–112 Date & Time 시트(라이트)**: "Clear / Date & Time". **시작 날짜·시간 알약 > End Date(Optional)**. **인라인 월 캘린더**(오늘=파란 링, 선택=채운 원, 평일/주말 색). **시간 스크롤 리스트**(7:45/8:00[선택]/8:15…). 하단 좌측 🌐 타임존 + **블랙 "Done"**.
- **113 타임존 피커**: "Find by city or name" 검색 + 도시 목록 + GMT 오프셋.
- **114**: 종료일 설정 시(Sun Aug 31 12:00am) end 알약에 ✕.
- **115** 날짜 반영된 생성 폼.
- **116/117 장소 피커**: "Place name, address, or link" 검색 → 결과 목록(📍아이콘 + 장소/주소) + **"✏ Use '입력값'" 커스텀 옵션**.
- **118/119 장소 상세**: 선택 카드 + ✏ + "ⓘ Approximate location shown before RSVP" + "Display name" 입력 + "Apt/Suite/Floor" 입력 + Save.

**이 구간 핵심**
- **DateTime = 인라인 캘린더 + 시간 스크롤 + 타임존**(시트). 오늘=파란 링, 선택=채운 원. (내 MonthCalendar 방향은 맞으나 잉크-반전 대신 Partiful은 파란 링/채움)
- 장소 = 자동완성 검색 + 결과(📍) + 커스텀 "Use" + 상세(표시명/호수/대략 위치 프라이버시).

### 120–129 · 정원/대기자·Chip In(결제, WARA 범위 밖)

- **121–124 정원**: "N total spots" 숫자 입력(iOS 숫자패드) + **"Waitlist" 토글**. "25/25 spots left".
- **125–129 Chip In(결제 수금)**: 모드 드롭다운(Turned Off / **Required amount ✓** / Pay what you can). "⚠ Payments are not verified · Guests self-report" 경고 카드. "Cost Per Person" 통화 드롭다운(USD $) + Amount. **Payment Method: Venmo(@) / Cash App($) / PayPal(@) / GoFundMe(link)**. "Suggested Amount". 노란 테마.

**이 구간 핵심**
- 숫자 입력 = iOS 숫자패드 + "Done".
- **Chip In = WARA 현재 범위 밖**(결제). 패턴만 기록.
- 드롭다운 = 알약형 셀렉트 + 바텀시트 옵션(체크).

### 130–139 · 통화 피커·RSVP 마감 피커·커스텀 필드

- **130 통화 피커 시트**: 국기 + 코드 목록(USD ✓).
- **131**: Chip In "💾 Saved!" 토스트 알약.
- **132–135**: chip-in 반영("$10 suggested (via Venmo)"), **RSVP Deadline 피커**(인라인 캘린더 + Time, 선택=파란 링/채움).
- **136–139 커스텀 필드 에디터 시트**: "Custom Field / Cancel / Save". "Link text"(또는 라벨) 입력. **아이콘 피커(가로 스크롤: 🔗link·♪music·🎁gift·👕shirt·🍴fork&knife·ⓘinfo·🚗car·🛏bed·📞phone·✨sparkle)** — 선택=링. "Link*" url 입력. 드레스코드 변형("Black tie, casual…" + 셔츠). 편집 시 **"Remove field"(빨강)**.

**이 구간 핵심**
- **+Link/+Playlist/+Dress code 등 = 커스텀 필드 시스템**: 라벨 + **아이콘 선택** + (선택)링크. → 초대장 정보 행이 데이터+아이콘 기반.
- 아이콘 세트(소): link/music/gift/shirt/fork-knife/info/car/bed/phone/sparkle.
- 저장 = "Saved!" 토스트. 통화 = 국기 셀렉트.

### 140–149 · 설명·Open Invite·RSVP 옵션(중첩 설정)

- **141** 설명 입력(키보드).
- **142 Edit Event**: "RSVP Options · 👍 Emojis", Quick actions for hosts.
- **143 Open Invite 시트**: "Post this event on the Partiful homepage…" 옵션 — 👥 All Hosts' Mutuals / 👤 Select Mutuals(›) / ⊗ **Turned Off(선택, 블랙 원 X)**.
- **145/148 RSVP Options 화면**: **반투명 그룹 카드(테마 위)** 행들 — Accept RSVPs(Until deadline ›) / Plus Ones(Up to 1 ›) / Require Guest Approval(토글) / Max Capacity(25 · Waitlist on ›) / Open Invite(드롭다운) / **RSVP Button Style(👍 Emojis ▾)** / Guests can RSVP "Maybe"(토글).
- **146/147 Accept RSVPs 하위**: 토글 + RSVP Deadline 행(날짜 + ✏).
- **149 Plus Ones 하위**: Plus Ones(Up to 1 ▾) + Require names(토글).

**이 구간 핵심**
- 설정/옵션 = **반투명 그룹 카드 + 행(라벨 + 값/›/토글/드롭다운)**, 테마 배경 위. 중첩 하위 화면.
- **RSVP 버튼 스타일 선택 가능**(Emojis 등). Open Invite = Mutuals 공개 범위.
- 토글 ON = 블랙 채움 + 흰 노브.

### 150–159 · Plus Ones·RSVP 버튼 스타일·설문 빌더

- **150/151 Plus Ones 드롭다운 시트**: No plus ones / Up to 1✓ / Up to 2~9.
- **153 ⭐ RSVP 버튼 스타일 시트**: **Emojis✓ / Icons / 🌹Bloom / 💋Flirty / ❤️Hearts / 🤵Modern dating / 🥵Sweaty(New)** — RSVP 이모지 세트를 테마처럼 교체.
- **154/155**: Hearts 적용 → Edit Event의 RSVP 글래스 원이 하트 변형으로.
- **156–159 설문 빌더**: "Questionnaire" 토글 + 질문 블록(타입 드롭다운 + Required 체크박스 + ✕ 삭제 + 입력) + "+ Add question" + **블랙 "Save"**. 질문 타입 시트: Short Answer✓ / Dropdown / Email / **Instagram·Twitter·TikTok·Snapchat·LinkedIn(소셜 수집)**. Dropdown 타입 = 옵션 + "+ New option".

**이 구간 핵심**
- **RSVP 버튼 스타일 = 교체 가능한 이모지/아이콘 세트**(7종). → 내 RSVP는 고정 이모지였음(보강 필요).
- 설문 = 폼 빌더(질문 타입 다양 + 필수 + 옵션). "New" 배지 = 블루 알약.

### 160–169 · 설문(이어서)·Auto-Reminders·Guest Approval

- **160–164** 설문 빌더 진행(Dropdown "Will you have cake?" Yes/No 옵션, Required✓, Save→**"Saving" 회색+스피너**).
- **165** 설문 응답 화면(질문 칩 + 응답 테이블).
- **166** Edit Event(RSVP Hearts, "Edit Questionnaire" 알약).
- **167/168 Auto-Reminders**: 토글 + "Your guests will receive: Reminders to RSVP(To [Invited][Maybe]) / Event Reminders(To [Going])" 반투명 카드.
- **169 Guest Approval 시트**: "Guests will request to 'Get on the list'…" + 현재 게스트 매핑(👍Going(1) → 🪄Approved / 🤔Maybe(1) → Approved) + **블랙 "Turn on Guest Approval"**.

**이 구간 핵심**: 저장 진행 = "Saving" 회색 버튼 + 스피너. 설정 카드 = 반투명 그룹 + 칩.

### 170–179 · Guest Approval RSVP·More 설정·Display&Privacy·COVID·테마 피커

- **170**: Guest Approval ON 시 RSVP가 **단일 "Get on the list" 버튼**(3 글래스 원 대신). "Remove Guest Approval".
- **171 More 설정 시트**: 👤Limit +1s / 🔒Hide Guest List / 🕐Hide Activity Timestamps / ➕Require COVID-19 Testing / ⚙All Settings / ❓FAQ.
- **172 Display & Privacy**: Show Activity Timestamps / Show Guest Names / Show Guest Count(토글) + "Guest List·Activity는 RSVP 전 숨김" + Event Password(Off, ✏).
- **173–175 이벤트 비밀번호 시트**: 설정 → 적용.
- **176–178 COVID-19 Safety**(범위 밖): Require Vaccination/Testing(드롭다운 Off/3일/1주 전)/Masks/Temperature Check 토글.
- **179 ⭐ 테마 피커(바텀)**: Edit Event 하단에 **원형 테마 스와치 행**(New 배지 + 여러 컬러 테마 + more) → 이벤트 **배경 테마** 선택.

**이 구간 핵심**
- Guest Approval = RSVP를 **단일 "Get on the list"**로 치환.
- **이벤트 배경 테마 = 원형 스와치 피커**(초대장 컬러/배경 세트). 내 "템플릿"과 대응되지만 Partiful은 배경 테마 + 폰트칩 + Effect(모션)를 분리 선택.

### 180–189 · 테마/이펙트 피커·이벤트 설정·호스트 관리

- **180/181 테마 피커**: 원형 테마 스와치(선택=링, New 배지). 배경 컬러/패턴.
- **182/183 ⭐ 이펙트 피커**: 하단 **원형 이펙트 썸네일 행**(⬆업로드 + 모션 이펙트들: 비눗방울 등). 선택=링. → **모션/이펙트는 테마와 별개 선택**.
- **184** Theme/Effect/Settings 툴바.
- **185/186 Event Settings 리스트**: Manage Hosts / RSVP Options / Questionnaire(On) / Display & Privacy / Photo Album / Chip In(On) / Auto-Reminders(Off) / COVID-19 Safety. "Get help": Help Center / Send Feedback / Contact Support (↗ 외부).
- **187 Manage Hosts**: "Add Cohost Via Link(Off ›)" + 호스트 행(SL 아바타, "Sam Lee / Creator · You").
- **188/189 Add Cohost Via Link**: 토글 + 링크 필드 + **블랙 "🔗 Copy"**.

**이 구간 핵심 (⭐ 초대장 커스터마이즈 3축)**
- **Theme(배경) × Font(Classic/Eclectic/Fancy/Simple) × Effect(모션)** 를 **각각 독립 선택**. → 내 엔진의 레이어 분리(Background/Motion/Content)와 개념 일치하나, Partiful은 사용자에게 3축을 노출.
- 설정 = 그룹 리스트(아이콘+라벨+값+›) + 외부링크(↗).

### 190–199 · 사진 앨범·내 프로필

- **190**: Copy → "✓ Copied" 회색.
- **191 Photo Album 설정**: "Only RSVP'ed guests can view" + "Allow Guests to Upload" 토글 + "View Album" 외곽 + **"🔗 Copy Album link"(그라데이션 알약)**.
- **192/193 앨범(빈)**: 폴라로이드+카메라 일러스트 + "Don't let the memories die in your camera roll" + **블랙 "📷 Drop the pics"(무지개 언더라인)**. Upload/Camera/Cancel 시트.
- **194/195 사진 추가**: "Tap below to add" + 사진 picker 그리드(시스템형) + 선택 시 미리보기 + 번호 배지.
- **196 업로드 중**: "📸 Uploading 38%…" 토스트 + 스켈레톤 타일 + 블랙 "⬆ Upload".
- **197 "📸 Uploaded!" 토스트** + 사진 타일.
- **199 ⭐ 내 프로필(다크)**: "Sam Lee ▾"(좌상) + ✏·⚙(우상). 아바타 + 카메라 배지. 이름. **"Edit profile" + "Share profile" 외곽 버튼**. "🐣 Joined Aug '25". **생일 프로모 카드(그라데이션) + "Add" 화이트**. "Mutuals" 섹션.

**이 구간 핵심**
- 앨범 업로드 = "Drop the pics" CTA(무지개 언더라인) + 진행 토스트 + 스켈레톤 + "Uploaded!" 토스트. "Copy ... link" = 그라데이션 알약.
- 내 프로필 = 다크, 이름 드롭다운 + edit/share + joined + 프로모 카드 + Mutuals.

### 200–209 · 내 프로필(채움)·프로필 편집

- **200/201 내 프로필(채움, 다크+컨페티)**: 이름 + "Taurus baby" bio + "𝕏 Sam.Mobbin" + **풍선 장식 + 홀로그래픽 업적 배지**. "Mutuals"(Sam Alex/Janet/Kim + 생일 + 채팅 아이콘) + "View all".
- **202/203 프로필 편집(다크)**: 아바타 + 카메라 배지, Name 필드, "Add bio", "Add birthday", **소셜 알약 "Add Instagram/Twitter/Snapchat"(그라데이션 외곽 알약)**. 입력 포커스 = 그라데이션 보더.
- **204–206 생일 휠 피커** → "May 21, 2001" + "Your birth year is kept private".
- **207** 프로필(사진 + insta 핸들 "samlee").
- **208/209** iOS 시스템 사진 Collections/크롭("Choose Photo").

**이 구간 핵심**
- 프로필 편집 = 다크 + **그라데이션 외곽 소셜 알약** + 인라인 필드(그라데이션 포커스).
- 프로필 장식 = 풍선/컨페티 + 홀로그래픽 업적 배지.

### 210–219 · 소셜 편집·계정 전환·Org 프로필(범위 밖)

- **210/213** 프로필 편집(사진/소셜 반영).
- **211/212 Edit Socials 시트(다크)**: Instagram/Twitter/Snapchat 필드(@ prefix + 아이콘).
- **214 계정 전환 시트**: "Sam Lee ✓" / "+ Create organization profile".
- **215–218 Org 프로필(범위 밖)**: New Org Profile(Org name* + bio + 소셜) / "Partiful Org Profiles" 프로모(스티커 배지 그리드 + 기능 + 화이트 "Create Org Profile") / Org 프로필(Edit/Followers/Share 아이콘박스 + "Create an event" 그라데이션 알약 + "Switched to…" 토스트).
- **219 Followers(빈, 다크)**: "Find someone" 검색.

**이 구간 핵심**: 계정 전환(개인/Org), 프로필 액션 = 아이콘+라벨 박스. Org는 WARA 범위 밖.

### 220–229 · 프로필 설정·계정·알림 설정

- **220 Followers**: 유저 행(아바타 + 이름 + 이모지 + 채팅/⋯). 다크.
- **221 Profile Settings(다크)**: ⚙Account Settings / 🔔Notifications / 📅Calendar Sync Preferences / 👁Accessibility / Ⓟ Customize App Icon / ❓Help / About / ➡Log out. **다크 그룹 리스트(아이콘+라벨+›)**.
- **222 Account Settings**: Synced Contacts(›) / Change phone number / **Delete Account(빨강)**.
- **223 Synced Contacts**: 연락처 행 + **"✦ On Partiful" 블루 배지**.
- **224–226 계정 삭제 시트**: 경고 + "Type DELETE to confirm" 입력 + Cancel/**Delete account(빨강, 입력 전 비활성→활성→"Deleting…" 로딩)**.
- **227–229 알림 설정**: "✉ Get Invites Via" 드롭다운(Push Notification / iMessage). 다크.

**이 구간 핵심**: 설정 = 다크 그룹 리스트. 파괴적 = "Type DELETE" + 빨강 버튼. 드롭다운 = 알약+▾ + 시트(체크).

### 230–233 · 앱 아이콘·홈(동적 인사)

- **230–232 Customize App Icon**: "Choose your fighter / Customize your app icon" + **아이콘 그리드**(Sweater/Gingerbread/Frosted/Classic/☺/Ambient/Cloudflow/Beer/Rave, 선택=퍼플 링) + iOS 네이티브 알럿("You have changed the icon…").
- **233 홈(동적 인사)**: "Welcome to **the weekend**, Sam 🍻"(시간대/상황별 인사 변형) + 필터 칩 + 대시 New-event 카드.

**이 구간 핵심**: 앱 아이콘 커스터마이즈(다수 테마). 홈 인사말은 동적.

---
*(234장 0~233 전수 확인 완료)*

## 종합 — Partiful 디자인 언어 (SoT)

### A. 테마 / 배경
- **기본 = 다크.** 앱 크롬(스플래시·온보딩·인증·홈·검색·알림·DM·프로필·설정)은 **순수 블랙(#000 근처) + 상단 모서리 은은한 퍼플/마젠타 그라데이션**.
- **이벤트/초대 화면 = 풀블리드 "테마" 배경**(이벤트별: 핑크/그린/노랑/하늘 메쉬, 종이질감, 사진 등) + **떠다니는 비눗방울 등 "Effect" 모션**.
- **시트/메뉴/팝오버는 화면 테마를 따름**(다크 화면=다크 시트, 라이트 테마 이벤트=라이트 시트).

### B. 타이포
- 헤딩 = **아주 크고 굵게**(블랙에 가까운 weight), 타이트 트래킹. 다크에선 흰색, 라이트 테마에선 블랙.
- 초대장 제목 글꼴은 **사용자 선택**: Classic / Eclectic / Fancy(필기체) / Simple.
- 본문/메타 = 작고 회색(muted).

### C. 색 / 인터랙션
- **인터랙티브 텍스트/링크 = 블루**(Save, Party Genie, Community Guidelines, "Poll your guests"). 퍼플은 보조(채팅 버블/일부 링크).
- **무지개 그라데이션은 "포인트"로만**: ① 화이트/블랙 CTA 버튼의 **하단 언더라인 글로우**, ② "Copy link" 등 일부 그라데이션 알약, ③ 장식. (단색 핑크/보라를 brand 단색으로 쓰지 않음.)
- 파괴적 = **빨강**(Cancel & notify guests, Delete account, Remove).

### D. 버튼 (재정의)
- **Primary = 배경 명도 반전**: 다크 위=**화이트(검정 텍스트)**, 라이트 위=**블랙(흰 텍스트)**. 모양은 **둥근 사각/알약**(라디우스 큼), 풀폭 하단 고정 다수.
- 비활성 = 회색. 로딩 = 인라인 스피너("Saving"/"Downloading"/"Sent!").
- CTA 글로우 = **하단 무지개 언더라인**(화이트/블랙 버튼 모두).
- 보조 = 외곽선 알약 / 텍스트(블루) / 그라데이션 외곽 알약(소셜).
- 파괴적 = 빨강 풀폭.

### E. 아바타 (재정의)
- **사용자별 비비드 그라데이션 원 + 모노그램(이니셜)**. (회색 아님!) 예: AS=오렌지-레드, JD=퍼플-블루, SL=블루-핑크.
- 호스트 표시 등은 별도.

### F. RSVP (재정의)
- **큰 프로스티드 글래스 원 3개**(Going/Maybe/Can't Go) + 이모지. (사각 버튼 아님!)
- **RSVP 버튼 스타일 세트 교체 가능**: Emojis/Icons/Bloom/Flirty/Hearts/Modern dating/Sweaty.
- Guest Approval ON 시 → **단일 "Get on the list" 버튼**.

### G. 칩 / 배지
- 칩 = 알약, 외곽선/채움, **이모지 + 라벨(+count)**, 선택 시 체크/밝게. 필터·상태·카테고리·vibe 전반.
- 배지: "HOSTING"(👑 글래스), "CANCELED"(그라데이션 배너), "New"(블루 알약), "On Partiful"(블루), D-day 등.
- **홀로그래픽 업적 스티커 배지**(프로필).

### H. 내비게이션
- **하단 탭바 = 아이콘 3~4개**(홈 / ⊞ 만들기 / [갤러리] / 프로필), **라벨 없음, FAB 없음**, 블랙 위 외곽 아이콘. (내 5개+핑크FAB와 다름!)
- 상단 = back(‹) / 가운데 제목 / 우측 액션(공유·⋯·⚙·✏). 홈은 좌상단 P로고 + 우상단 벨·채팅.
- 이벤트 상세 하단 = **플로팅 글래스 알약 툴바**(Edit/Text Blast/[count]Going 중앙강조/Invite/More).

### I. 카드 / 리스트
- 홈 이벤트 카드 = **이미지 지배** + 좌상단 날짜 알약 + 우상단 ⋯ + 우하단 상태 배지 + 아래 제목/호스트. 가로 스크롤. 그리드↔리스트 토글.
- 리스트 행 = 썸네일/아바타 + 텍스트 + 우측 값/액션.

### J. 시트 / 오버레이 / 토스트
- 바텀시트 = 그래버 + 제목 가운데 + 행(이모지/아이콘) + 주 액션(반전색 풀폭). 시트 테마는 화면 따름.
- 토스트 = 떠 있는 둥근 알약(+이모지): "Invite sent!"·"Saved!"·"Uploaded!"·"Canceled".
- 파괴 확인 = iOS 네이티브 알럿 또는 "Type DELETE".

### K. 모션 / 이펙트
- 시그니처 = **떠다니는 비눗방울**(이벤트 배경). 그 외 컨페티/풍선/반짝임. **Effect는 Theme과 별개로 선택**.
- 온보딩 = 추억 사진 콜라주 + 떠다니는 글래스 칩/말풍선.

### L. 초대장 커스터마이즈 = 3축 분리
- **Theme(배경 컬러/패턴) × Font(제목 글꼴) × Effect(모션)** 각각 독립 선택 + 커버 이미지(Posters/GIFs/Photos 검색·업로드).
- 정보 = **커스텀 필드 시스템**(라벨 + 아이콘 선택 + 링크): Location/Cost/Dress code/Link/Playlist/Registry 등.

---

## 내 구현과의 핵심 격차 (재수정 대상)

| # | 항목 | Partiful | 내가 만든 것 | 조치 |
|---|------|----------|-------------|------|
| 1 | **테마 기본** | **다크 기본**(앱 크롬 블랙) | 라이트 기본 | 다크 기본으로 전환 |
| 2 | **아바타** | 사용자별 **그라데이션 모노그램** | 회색 단색 | 그라데이션 아바타 재작성 |
| 3 | **RSVP** | **글래스 원 + 스타일 세트 교체** | 사각 버튼 고정 | 글래스 원 + 스타일 세트 |
| 4 | **인터랙티브 색** | **블루 링크** + 무지개=포인트 | accent=핑크 | 블루 링크 도입, 핑크는 포인트 |
| 5 | **하단 탭바** | 아이콘 3~4개, 라벨X, FAB X | 5개 + 핑크 FAB | 미니멀 3~4개로 |
| 6 | **타이포** | 초대형 볼드 + 제목 글꼴 선택 | 보통 굵기 | 헤딩 스케일 강화 + 글꼴 토글 |
| 7 | **이벤트 배경** | 풀블리드 테마 + 비눗방울 Effect | 카드형 템플릿 | 풀블리드 + Effect 분리 |
| 8 | **버튼 글로우** | 화이트/블랙 둘 다 하단 무지개 | 일부만 | 반전색 + 글로우 일관 |
| 9 | **글래스모피즘** | 광범위(툴바/카드/RSVP/시트) | 제한적 | 글래스 surface 적극 도입 |
| 10 | **초대 커스터마이즈** | Theme×Font×Effect 3축 + 커스텀필드 | 템플릿 단일 선택 | 3축 분리 노출 검토 |
| 11 | **시트 테마** | 화면 테마 추종 | 단일 | 컨텍스트 테마 |
| 12 | **칩** | 이모지+count, 토글 | 기본 칩 | 이모지/카운트/토글 보강 |

> **방향 확정(2026-06-14)**: 테마는 **라이트 기본 유지**. Partiful의 구조/컴포넌트/디테일을 **라이트 버전**으로 이식. (다크는 차후 — 토큰 다크값은 유지)

---

## Partiful ↔ WARA 기능 매트릭스
> 명세서 최신 아님 가능 → 코드(DTO/모듈) 기준 + 불확실 시 **사용자 확인**. (✓ 있음 / ~ 부분 / ✕ 없음 / OOS 범위밖 추정)

### WARA가 이미 가진 것 (재구현 X, UI만 Partiful화)
- **RSVP 이모지/라벨 커스터마이즈**(rsvpAttending/Maybe/Declined Emoji+Label) — Partiful RSVP 스타일 세트 대응
- **초대장 3축**: `bgColor`(테마)·`font`(글꼴)·`animation`(Effect)
- **커버**: `mainImageKey`(업로드/AI) + `mainGifUrl`(Klipy GIF 검색)
- `isPublic`·`fee`·`dressCode`·`category`·`parkingInfo`
- RSVP(attending/undecided/absent), 참가자 프로필·mutual·shared-invitations, 숨김 토글, 탈퇴/강퇴
- 댓글=**feedbacks(중첩 대댓글)** · 앨범(+좋아요) · 공유 send-logs(link/kakao/sms/email/dm)
- **WARA 고유**: 미션 · 실시간 위치공유 · 리마인드 앨범(Best9) · 사진 지도 · 날씨 · date-vote(=Partiful Poll 확장)
- DM(이미지·이모지 리액션) · 친구 · 알림 · 차단 · AI 커버 · 약관 · 문의 · FAQ

### Partiful에 있고 WARA엔 없음/부분 (→ 확인 대상)
| 기능 | WARA | 비고 |
|---|---|---|
| Cohosts(공동 호스트) | ✕ | role 확장 필요 |
| Plus Ones(+N 동반) | ✕ | |
| Waitlist/정원 제한 | ✕ | capacity 없음 |
| Questionnaire(RSVP 질문) | ✕ | 모듈 없음 |
| Guest Approval(승인제) | ✕ | |
| RSVP 마감일(명시) | ~ (closed만) | |
| Event Password/목록 숨김 | ✕ | |
| Text Blasts(단체 메시지) | ~ (DM·알림 존재) | 단체발송 UI 없음 |
| Auto-Reminders 설정 | ~ (알림 존재) | 호스트 설정 UI 없음 |
| Make Flyer + QR | ✕ | |
| Calendar Sync | ✕ | |
| Clone Event(복제) | ✕ | |
| 커버 스톡 검색(Posters/Photos) | ~ (AI+GIF+업로드) | 무료 스톡 검색 없음 |
| 체크인 + CSV 내보내기 | ✕/? | participants 목록만 |
| Boops(콕 찌르기) | ✕ | |
| 업적 배지 | ✕ | |
| 연락처 동기화 | ✕ | 친구로 대체? |
| Chip In(결제) / COVID / Org / 앱아이콘 | OOS | 범위밖 추정 |

### 댓글 입력 바 (Partiful 동일 — 구현 확정)
- 1행: **아바타 + 입력 + 전송(원형 ↑)**
- 2행(입력 아래): **GIF · 사진 · 멘션(@)** 추가 버튼
- WARA에 GIF(Klipy)·사진(앨범)·멘션 모두 존재 → 매칭 가능

### ✅ 기능 결정 (2026-06-14, 사용자 승인)
- **추가 구현(이번 범위)**: Cohosts · Questionnaire · RSVP 마감일 · 커버 스톡 검색 · Text Blasts · Auto-Reminders · Make Flyer+QR · Clone Event · 업적 배지 · Event Password/목록 숨김
  - 백엔드 동반 필요: Questionnaire · Cohosts · Text Blasts · Auto-Reminders · Event Password (구현 전 API 설계 확인)
- **추후 구현(보류)**: Plus Ones · Waitlist/정원 · Guest Approval · 체크인+CSV · Calendar Sync · Boops
- **범위 밖(제외)**: Chip In(결제) · COVID-19 · Org 프로필 · 앱 아이콘

