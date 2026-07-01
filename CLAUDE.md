# WARA — CLAUDE.md

흔한 LLM 코딩 실수를 줄이기 위한 행동 지침.
속도보다 신중함을 우선시함. 단순한 작업은 판단해서 적용.

---

## 1. 코딩 전에 생각하기
가정하지 마. 혼란을 숨기지 마. 트레이드오프를 드러내.

- 가정이 있으면 명시적으로 말할 것. 불확실하면 물어볼 것.
- 해석이 여러 가지면 조용히 선택하지 말고 제시할 것.
- 더 단순한 방법이 있으면 말할 것. 필요하면 반박할 것.
- 뭔가 불명확하면 멈추고 뭐가 헷갈리는지 말한 뒤 물어볼 것.



## 2. 단순하게
문제를 해결하는 최소한의 코드만. 추측성 코드 금지.

- 요청한 것 외의 기능 추가 금지.
- 단일 사용 코드에 추상화 금지.
- 요청하지 않은 유연성·설정 가능성 추가 금지.
- 200줄로 짤 걸 50줄로 짤 수 있으면 다시 짤 것.
- 구현 범위 밖 기능을 임의로 추가하지 마 (아래 Scope 참고)

## 3. 필요한 부분만 수정
요청한 것만 건드려. 내가 만든 것만 정리해.

- 인접한 코드·주석·포맷 개선 금지.
- 안 부서진 것 리팩터링 금지.
- 내 스타일이 달라도 기존 스타일 맞출 것.
- 관련 없는 dead code 발견 시 언급만 할 것. 삭제 금지.
- 변경한 모든 줄은 요청 사항으로 직접 추적 가능해야 함.

## 4. 목표 기준으로 실행
성공 기준을 정하고 검증될 때까지 반복.

- "버그 고쳐줘" → "버그를 재현하는 테스트 짜고 통과시켜"
- "엔드포인트 추가" → 명세 확인 → 구현 → 테스트 통과
- 여러 단계 작업은 시작 전에 간단한 계획 먼저 제시.

## 5. LLM Output 규칙

LLM은 아래 형식을 반드시 따른다.

- 요구사항이 불명확하면:
  → 코드 작성 전에 질문 1~3개 먼저 제시

- 다단계 작업이면:
  → 1. 간단한 계획 제시
  → 2. 사용자 확인 후 구현

- 선택지가 존재하면:
  → 최소 2개 옵션 + trade-off 설명

- 코드 작성 시 반드시 포함:
  → 변경 파일
  → 변경 이유
  → 영향 범위

## Always
- DB 변경 시 migration 생성 필수
- 변경 작업에 Idempotency-Key 포함
- Soft delete 우선 (hard delete 금지)
- 새 endpoint → @docs/api/WARA_API_설계_v0.7.md 명세 확인 후 구현

## Never
- 환경변수 하드코딩 (.env 사용)
- console.log 커밋 (logger 사용)
- raw SQL 직접 작성 (Drizzle query builder)
- 평문 비밀번호 저장 (bcrypt)
- any 타입 사용

---

## Verify
PR 머지 전 반드시 통과
`pnpm lint && pnpm typecheck && pnpm test && pnpm build`

## 기능 명세 (Feature Spec) — SoT: manyfast

> 출처: manyfast 프로젝트 "WARA - 통합 모임/이벤트 초대장 서비스" (projectId `50ef2cb6-ccc5-412d-8031-ee3b88ad2b70`).
> 전체 구조: **16 요구사항(R-) → 55 기능(F-) → 110 스펙(S-)**. 신규 작업은 이 명세를 기준으로 한다.
> 코드 구현 상태 대조는 `new_plan.md` 참고.

### 역할 / 디바이스
- **Roles**: 사용자 · 호스트 · 공동 호스트 · 관리자
- **Devices**: Web · Mobile App · **Category**: social

### 요구사항 개요 (16개)
| ID | 요구사항 | 중요도 |
|----|------|:--:|
| R-REENMY | 회원가입/로그인(소셜 로그인) | high |
| R-RWXOOV | 초대장 생성 및 공유 | high |
| R-PSWNJG | AI 기반 초대장 이미지 생성 | medium |
| R-FNIWJR | 일정 조율 및 확정 | high |
| R-FOTKSQ | 참가자 관리 및 역할 설정 | high |
| R-CTCIIZ | 모임 소통 채널(채팅·DM·활동피드) | high |
| R-XTUKTC | 실시간 위치 공유 | medium |
| R-GRVDJB | 모임 사진 공유 및 관리 | high |
| R-QXNIND | 모임 비용 정산 | high |
| R-BFNULL | 모임 리마인드 및 재모임 유도 | medium |
| R-TOMOAT | 공개 초대장(지역 기반 탐색) | high |
| R-EXKDIN | 친구목록(같은 모임 참여자 자동 추가) | medium |
| R-SCOBES | 마이페이지(프로필/설정/내역) | high |
| R-RMZDGD | 고객센터(문의/도움말) | medium |
| R-UBNIJA | 약관/정책 동의 및 열람 | high |
| R-NJJYOA | 어드민 페이지(운영/관리 백오피스) | medium |

### 기능·스펙 상세 (55 기능 / 110 스펙)

`imp`=importance, `dev`: W=Web / M=Mobile. roles가 비어 있으면 명세상 미지정.

#### R-REENMY 회원가입/로그인
- **F-TRBWGU 소셜 로그인(구글/애플/카카오/네이버)** `high` · 사용자 · W,M
  - S-EAPNMP 시작/콜백 처리 · S-KXJTCG 신규가입 vs 계정연결·병합 · S-YVDJND 제공자별 정책·애플 숨김이메일
- **F-EJNNGR 로그아웃 및 계정 탈퇴** `medium` · 사용자 · W,M
  - S-GXLGJO 로그아웃-세션/토큰 제거 · S-XYSNOG 탈퇴 요청/유예/데이터처리

#### R-RWXOOV 초대장 생성 및 공유
- **F-PFLCKA 초대장 템플릿 선택 및 편집** `high` · 사용자 · W,M
  - S-RPMFRI 템플릿 목록/미리보기 · S-XMWTGJ 기본정보 입력 · S-OECKET 디자인요소 편집(테마/배경/애니메이션) · S-OEDWWE 참여자 아바타 좌우스크롤/전체목록 · S-ANESSL 나의 RSVP 버튼(참여/미정/불참)
- **F-UMDBGD 초대장 링크 공유 및 OG 미리보기** `high` · 사용자 · W,M
  - S-HJNCIM 공유링크 생성/복사 · S-YRBTRI OG 미리보기 정보구성 · S-HLZVXV 공유 기본문구 편집
- **F-NGSSTO 초대장 비밀번호 보호 및 접근제어** `high` · 호스트/공동호스트 · W,M
  - S-THLGZB 비밀번호 설정/해제(해시저장·평문금지) · S-MYIFWU 입력 게이트(시도제한/쿨다운) · S-ONFCXJ 변경·링크 재발급
- **F-ROXICR 초대장 BGM 선택 및 자동재생** `medium` · 호스트/공동호스트/사용자 · W,M
  - S-CDWTPH · S-NPMCBM · S-WSENPQ

#### R-PSWNJG AI 기반 초대장 이미지 생성
- **F-QYVVKC AI 이미지 생성** `medium` · 사용자 · W,M
  - S-CCBXJK OpenAI API 이미지 생성 호출 · S-SKKZPM 미리보기/선택
- **F-OLZDPC 일일 생성 횟수 제한 및 사용량 관리** `medium` · 사용자/호스트/공동호스트 · W,M
  - S-PIKHHO 일일 3회 제한 · S-YVYEAB 남은횟수 표시 · S-NDWBQP 초과 안내메시지
- **F-EPOHCF 서킷 브레이커 및 오류처리** `medium` · 관리자 · W,M
  - S-QSTATV 패턴 적용 · S-XBFGIT 실패 시 대체옵션 · S-FACYJW 지연/타임아웃 처리

#### R-FNIWJR 일정 조율 및 확정
- **F-KEPBSV 일정 후보 생성(날짜/시간 슬롯)** `high` · (roles 미지정)
  - S-YFQGAT 슬롯 추가/수정/삭제 · S-GVHLFH 투표마감 설정/연장 · S-YFMMJG 투표 링크/진입동선 · S-XEUVDI 투표유형(날짜만/날짜+시간/커스텀) · S-GMEASP 날짜후보 30개 제한/빠른추가 · S-JDTJFW 여러 투표 생성/목록관리
- **F-TMAXOC 참가자 투표 및 내 선택 확인** `high` · (roles 미지정)
  - S-LPXPYL 복수/불가 선택 · S-TNWTCZ 내 투표 확인/변경 · S-SHBOPO 현황요약-유력슬롯 · S-JKVDRU 커스텀 투표(단일/복수)
- **F-XRMNXP 일정 확정 및 공지 반영** `high` · (roles 미지정)
  - S-DUMDYU 확정/되돌리기 · S-EOXMFM 초대장/모임공간 반영 · S-SARYMG 확정 알림발송 · S-XLJOWL 공동1등 시 호스트 선택확정

#### R-FOTKSQ 참가자 관리 및 역할 설정
- **F-MBOMQU 참가자 RSVP 관리** `high` · 호스트/공동호스트 · W,M
  - S-BFHIYM 상태목록 조회 · S-KTCOMR RSVP 응답 · S-CGJHOV 통계/요약
- **F-GZGMHJ 호스트 권한 위임 및 공동호스트 지정** `high` · 호스트/공동호스트 · W,M
  - S-LZMEHE 전체위임 · S-FXJNUO 공동호스트 지정/해제 · S-JUQWXA 위임 안내/확인
- **F-RIBUFY 참가자 차단 및 제거** `high` · 호스트/공동호스트 · W,M
  - S-FYFCHX 참가자 제거 · S-QOMRSH 참가자 차단 · S-OFEOYL 사유기록/통지

#### R-CTCIIZ 모임 소통 채널
- **F-FHPQJD 그룹 DM** `high` · 사용자/호스트/공동호스트 · W,M
  - S-UXOFLN 텍스트 전송/수신 · S-UFBLFZ 이미지/이모지 전송 · S-BDZMFH 공지 고정
- **F-UKCZZH 1:1 DM** `high` · 사용자/호스트/공동호스트 · W,M
  - S-OCZUIF 상대선택/대화시작 · S-HFLNEK 대화목록/검색 · S-FZDASD DM 알림제어
- **F-MZPMRW 메시지 알림 및 지연 최소화** `high` · 사용자/호스트/공동호스트 · W,M
  - S-YBSASJ 푸시/웹 알림 · S-MHGJJD 알림설정 모임별/전체 · S-SDKQFZ 실시간 품질지표(운영용)
- **F-XGWBYE 초대장 활동 피드(실시간)** `high` · 사용자/호스트/공동호스트 · W,M
  - S-JZNTJB 이벤트타입 정의/필터링 · S-JZBGVX 실시간 동기화/백필
- **F-DPZZXZ 활동 피드 댓글(태그/사진/GIF)** `high` · 사용자/호스트/공동호스트 · W,M
  - S-AJTWDD 댓글 메시지/이미지 입력
- **F-DQUTXZ 호스트 공지사항 작성/노출(활동/상단고정)** `high` · 호스트/공동호스트 · W,M · (spec 미정)

#### R-XTUKTC 실시간 위치 공유
- **F-QOHBNO 실시간 위치 공유 활성화** `medium` · 사용자/호스트/공동호스트 · **M 전용**
  - S-WJBYGT 토글 · S-VSVAFY GPS 실시간 추적 · S-GAHCGR 상태표시/타임스탬프
- **F-ELEOWP 프라이버시 티어(완전공유/거리만/비공개)** `medium` · 사용자/호스트/공동호스트 · W,M
  - S-KCKLCY 티어 선택 · S-VGIYHB 기본설정/모임별 조정 · S-ULTZWS 변경 즉시반영
- **F-SZVDFN 지도 뷰 및 참가자 위치 확인** `medium` · 사용자/호스트/공동호스트 · W,M
  - S-MZKFTN 지도 로드/마커 · S-MHBBMR 마커탭 정보 · S-CHPWCH 실시간 업데이트 · S-KNVVIT 주기/배터리 안내

#### R-GRVDJB 모임 사진 공유 및 관리
- **F-ONZZVH 모임 앨범 사진 업로드/보기** `high` · 사용자 · W,M
  - S-YIFCMK 다중 업로드 · S-NZWCRO MIME 검증/제한 · S-EHSHKO 앨범탐색 그리드/정렬
- **F-JOHVID 사진 피드백(좋아요/댓글)** `high` · 사용자/호스트/공동호스트 · W,M
  - S-WREQLZ 좋아요/취소 · S-XLUQJX 댓글 작성/삭제 · S-ZHHHHY 신고/숨김
- **F-XDIPRF 베스트 선정 및 중복 사진 감지** `medium` · 호스트/공동호스트/관리자 · W,M
  - S-FDSVVY 대표·베스트 선정 · S-UQDXMK 중복사진 감지처리 · S-FWRMAK 사진 지도보기

#### R-QXNIND 모임 비용 정산
- **F-HXJLCE 비용 항목 추가/수정/삭제** `high` · 사용자/호스트/공동호스트 · W,M
  - S-SIZZCF 항목 폼 · S-IRPDRC 간편입력(총액/인원/자동분배) · S-RJCQCA 항목 변경이력
- **F-FABSQQ 정산 자동 계산 및 요약** `high` · 사용자/호스트/공동호스트 · W,M
  - S-GRVMEA 부담비율 설정 · S-RBPBLL 정산결과 계산(송금표) · S-QGXASM 확정/완료체크
- **F-OOKNFO 정산 요약 공유(링크/이미지)** `high` · 사용자/호스트/공동호스트 · W,M
  - S-XIEBRE 읽기전용 링크 · S-PJWPWR 이미지 카드 · S-XNWYEE 익명화 옵션

#### R-BFNULL 모임 리마인드 및 재모임 유도
- **F-FUNIDM 리마인드 알림 발송/수신 설정** `medium` · 사용자/호스트/공동호스트 · W,M
  - S-KEGRNV 발송시점(7/30일) · S-JZABXF 수신/무음 설정 · S-MVZANX 재알림 정책
- **F-NJTOMM 리마인드 화면(하이라이트/대표사진/정보)** `medium` · 사용자/호스트/공동호스트 · W,M
  - S-ALXPVX 하이라이트 자동구성 · S-LHOBRB 앨범/정산 빠른이동 · S-GNDEQG 하이라이트 공유
- **F-YWWZNF 재모임 만들기(모임 복제)** `medium` · 호스트/공동호스트 · W,M
  - S-FEVLCB 기존 멤버/설정 불러오기 · S-BEZXZU 복제 후 초대장 생성진입 · S-UKYAHA 복제범위 선택
- **F-IDGKWC 별점/리뷰 요청(희소 노출)** `medium` · 사용자 · W,M · (spec 미정)

#### R-TOMOAT 공개 초대장(지역 기반 탐색)
- **F-HDMEOT 초대장 공개/비공개 설정** `high` · 호스트/공동호스트 · W,M
  - S-JZNYKW 공개상태 토글/노출범위 안내
- **F-WASSLI 공개 초대장 열람 및 RSVP** `high` · 사용자/호스트/공동호스트 · W,M
  - S-PYYOWQ 공개 상세열람(비회원/회원) · S-MXFUPA 공개 RSVP 선택/변경
- **F-KAHNVA 내 위치 등록 및 주변 공개모임 탐색** `high` · 사용자 · **M 전용**
  - S-OYYYSM 위치권한/등록·갱신 · S-UNREHJ 주변 공개모임 목록(반경/정렬/필터) · S-PLZIEZ 공개모임 신고/숨김

#### R-EXKDIN 친구목록
- **F-JXCVQQ 친구 자동추가 및 목록 관리** `medium` · 사용자 · W,M
  - S-ANUCGX 자동추가 조건/시점 · S-ROGBNG 숨김/삭제/재추가 규칙
- **F-RQBFNV 친구 기반 빠른선택(초대/DM 연동)** `low` · 사용자 · W,M
  - S-NPFOXN

#### R-SCOBES 마이페이지
- **F-QERKMV 프로필 조회/수정** `high` · 사용자 · W,M
  - S-BLHFEI 정보 표시/조회 · S-HMYVDG 편집(닉네임/사진/상태메시지)
- **F-MPBPAP 내 모임/참여 내역** `high` · 사용자 · W,M
  - S-JPGKAL 목록 탭/필터 · S-GHQRSX 모임 카드 · S-LRTMBN 빠른접근 CTA
- **F-OAGNIV 설정/계정관리(알림/보안/차단/탈퇴)** `high` · 사용자 · W,M
  - S-TYGJIE 알림설정 전체/모임별 통합
- **F-AWFJXB 저장/공유 내역** `medium` · 사용자 · W,M
  - S-KZIJGR 유형별 분류 · S-PEOVCR 삭제/정리
- **F-RRGTST 고객센터 진입** `medium` · 사용자 · W,M
  - S-KCNFTA

#### R-RMZDGD 고객센터
- **F-SIVXPW 도움말/FAQ(검색/카테고리)** `medium` · 사용자 · W,M
  - S-FFUCLF 검색/카테고리 탐색 · S-SRCUOD 상세/도움말 문서
- **F-CJCIXI 문의하기(유형/첨부/접수)** `medium` · 사용자 · W,M
  - S-EGTSKY 유형 분류/첨부 업로드
- **F-IOFTOP 내 문의 내역/답변 확인** `low` · 사용자 · W,M
  - S-YYBFAL 목록 조회 · S-BZXCZO 상세/답변 확인

#### R-UBNIJA 약관/정책 동의 및 열람
- **F-YECRCZ 로그인 시 약관 동의 플로우** `high` · 사용자 · W,M
  - S-XEJEBQ 버전 갱신 시 재동의
- **F-MJUIEM 약관/정책 전문 열람(마이페이지)** `medium` · 사용자 · W,M
  - S-WBVANH

#### R-NJJYOA 어드민 페이지 (W 전용)
- **F-YSMPKQ 어드민 인증/권한(역할기반)** `high` · 관리자 · W
  - S-NBKIZW 로그인/역할기반 메뉴
- **F-UBKGMJ 사용자/모임 조회 및 상태관리** `high` · 관리자 · W
  - S-SMLGYK 검색/상세조회 · S-EPMKQS 사용자 상태변경/제재 · S-YQPAUT 모임 상태변경/삭제
- **F-VVMKGM 신고/제재 처리(콘텐츠 숨김/복구)** `high` · 관리자 · W
  - S-AQQDWN 신고큐 처리(메모/상태)
- **F-OPDSEN 콘텐츠/운영 설정(공지/배너/템플릿/리마인드 정책)** `medium` · 관리자 · W
  - S-VBNAGP 정책값 변경이력/승인
- **F-CZIBFZ 정산 이슈 대응/공유 링크 회수** `medium` · 관리자 · W
  - S-FMYZWK 오류로그 조회 · S-IEHKNN 공유링크 회수
- **F-CUNLON 운영 대시보드(핵심 지표)** `low` · 관리자 · W
  - S-JFYNFB 대시보드 구성 · S-TCYOTI MAU/DAU/WAU · S-GPQGEM 리텐션 통계 · S-XWFMHJ 초대장→참여 전환/퍼널

### 명세 정합성 주의
- **모바일 전용**: F-QOHBNO(위치공유 활성화), F-KAHNVA(주변 공개모임 탐색)
- **Web 전용**: 어드민 6개 기능(F-YSMPKQ / F-UBKGMJ / F-VVMKGM / F-OPDSEN / F-CZIBFZ / F-CUNLON)
- **roles/devices 미입력(명세 결함)**: 일정 조율 3개(F-KEPBSV / F-TMAXOC / F-XRMNXP)
- **spec 미정 기능**: F-DQUTXZ(호스트 공지), F-IDGKWC(별점/리뷰)

템플릿 미리보기 이미지 경로 SoT: `apps/web/public/template_images/{slug}/`

## Refs
- @docs/api/WARA_API_설계_v0.7.md
- @docs/db/WARA_ERD_v0.6.1.md
- @docs/conventions/error-codes.md
- @docs/decisions/
