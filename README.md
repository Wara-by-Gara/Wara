# WARA(와라) | 요즘 모이는 방식

**'준비의 부담'을 '만남의 설렘'으로 바꾸기 위한 첫걸음**

[사진 준비중: WARA 서비스 대표 배너 이미지]

**🔗 서비스 바로가기: [wara.kr](https://wara.kr)**

---

## 목차

1. [WARA 소개](#1-wara-소개)
2. [기획 과정](#2-기획-과정)
3. [주요 기능](#3-주요-기능)
4. [팀 소개](#4-팀-소개)
5. [서비스 구조](#5-서비스-구조)
6. [기술적으로 고민한 부분](#6-기술적으로-고민한-부분)
7. [사용한 기술과 배포](#7-사용한-기술과-배포)

---

# 1. WARA 소개

**WARA는 모임의 시작부터 끝까지를 하나의 흐름으로 연결하는 통합 모임/이벤트 초대장 서비스입니다.**

모임을 만들 때 우리는 여러 개의 앱을 오갑니다. 단톡방에서 일정을 조율하고, 지도 앱으로 위치를 공유하고, 정산 앱으로 비용을 나누고, 클라우드에 사진을 모읍니다.
WARA는 이 파편화된 경험을 하나의 플랫폼으로 통합하여 호스트와 게스트 모두에게 더 편리한 오프라인 모임 경험을 제공합니다.

[사진 준비중: 서비스 핵심 플로우 소개 이미지 (초대장 생성 → 공유 → 모임 → 추억)]

---

# 2. 기획 과정

## 창업 프로그램 검증과 멘토링

WARA는 단순한 사이드 프로젝트가 아니라, **실제 시장의 문제를 해결하는 서비스**를 목표로 출발했습니다.

- 🏆 **'모두의 창업' 1차 통과** — 기획 단계에서 아이디어의 시장성과 문제 정의의 타당성을 외부 심사로 검증받았습니다.
- 🧭 **전문 멘토링을 통한 디벨롭** — 프로그램 멘토링을 통해 타겟 사용자 정의, 핵심 기능 우선순위, 수익 모델 방향을 다듬으며 기획을 구체화했습니다.

[사진 준비중: 기획 과정 (모두의 창업 발표 자료 / 멘토링 / 유저 플로우 차트)]

---

# 3. 주요 기능

### 📨 초대장 생성 및 공유
- 템플릿 선택, 테마/배경/애니메이션 편집, BGM 설정까지 가능한 **커스텀 초대장 에디터**
- 링크 공유 시 **OG 미리보기 자동 구성**, 공유 문구 편집
- **비밀번호 보호 초대장** — bcrypt 해시 저장, 입력 시도 제한 및 쿨다운으로 무차별 대입 방어

[사진 준비중: 초대장 생성/편집 화면]

### 🤖 AI 초대장 이미지 생성
- OpenAI 이미지 생성 API 연동, 미리보기 후 선택 적용
- **일일 3회 사용량 제한** 및 남은 횟수 표시
- 외부 API 장애에 대비한 **서킷 브레이커 패턴** 적용 (자세한 내용은 [6장](#6-기술적으로-고민한-부분) 참고)

[사진 준비중: AI 이미지 생성 화면]

### 🗳️ 일정 조율 및 확정
- 날짜/시간 슬롯 투표, 복수 선택·불가 표시, 커스텀 투표 지원
- 투표 마감 설정/연장, 유력 슬롯 실시간 요약
- 일정 확정 시 초대장·모임 공간에 자동 반영 및 알림 발송

[사진 준비중: 일정 투표 화면]

### 💬 실시간 소통 (채팅 · DM · 활동 피드)
- Socket.IO 기반 **1:1 DM 및 그룹 채팅**
- 모임 내 활동(참여, 사진 업로드, 투표 등)을 모아 보여주는 활동 피드
- WebSocket 실시간 알림 게이트웨이

### 📍 모임 당일 실시간 위치 공유
- 참가자 간 실시간 위치 공유 + 카카오맵 연동
- **3단계 프라이버시 티어(full / distance / hidden)** 로 위치 노출 수준을 사용자가 직접 제어

[사진 준비중: 실시간 위치 공유 지도 화면]

### 📸 사진 공유 및 앨범
- S3 Presigned URL 기반 직접 업로드로 서버 부하 최소화
- 업로드 파일 매직넘버 검증, 클라이언트 이미지 압축
- EXIF GPS 메타데이터 추출 — 사진을 지도 위에 표시하는 기능으로 확장

### 🌦️ 모임 날씨 안내
- 기상청(KMA) 단기예보 API 연동, 모임 장소·일시 기준 날씨 제공
- Redis 캐싱 + 장애 격리 설계 (자세한 내용은 [6장](#6-기술적으로-고민한-부분) 참고)

### 🗺️ 공개 초대장 탐색 & 소셜
- 지역 기반 공개 초대장 지도 탐색
- 같은 모임 참여자 자동 친구 추가, 친구 목록

### 🛠️ 운영을 위한 백오피스
- 관리자 페이지(별도 Next.js 앱): 사용자/초대장/신고/문의 관리, 통계 대시보드
- 고객센터(문의/FAQ), 약관·정책 동의 및 열람 플로우

---

# 4. 팀 소개

**"Wara by Gara"** — 8인 팀이 기획부터 배포·운영까지 함께 만들었습니다.

| 이름 | GitHub | 역할 | 담당 |
|---|---|---|---|
| 강에스더 | [@lareina7486](https://github.com/lareina7486) | [역할 기입] | [담당 파트 기입] |
| 김현제 | [@KIMHYUNJE](https://github.com/Wara-by-Gara) | [역할 기입] | [담당 파트 기입] |
| 김민성 | [@Minsung Kim](https://github.com/Wara-by-Gara) | [역할 기입] | [담당 파트 기입] |
| 윤숙희 | [@ZoeYoon](https://github.com/Wara-by-Gara) | [역할 기입] | [담당 파트 기입] |
| 이하림 | [@sumforest-ha](https://github.com/sumforest-ha) | [역할 기입] | [담당 파트 기입] |
| 박영서 | [@YoungSeo1104](https://github.com/YoungSeo1104) | [역할 기입] | [담당 파트 기입] |
| 최우진 | [@DevWoojin97](https://github.com/DevWoojin97) | [역할 기입] | [담당 파트 기입] |
| 박수훈 | [@mdeeno](https://github.com/mdeeno) | [역할 기입] | [담당 파트 기입] |

[사진 준비중]

---

# 5. 서비스 구조

## 모노레포 구조 (Turborepo)

```
Wara/
├── apps/
│   ├── api/        # NestJS 11 — REST API + WebSocket 게이트웨이
│   ├── web/        # Next.js 15 — 사용자 웹 (PWA)
│   ├── mobile/     # Expo(React Native) — iOS/Android 앱
│   └── admin/      # Next.js 15 — 운영 백오피스
├── packages/
│   ├── ui/             # 공유 UI 컴포넌트
│   ├── tokens/         # 디자인 토큰 (web/mobile 색상·타이포 일원화)
│   ├── eslint-config/  
│   └── tsconfig/       
├── loadtest/       # k6 부하 테스트 시나리오 + 보고서
└── docs/           
```

**하나의 서비스를 Web / Mobile / Admin 세 클라이언트가 공유**하기 때문에, 디자인 토큰과 UI 패키지를 워크스페이스로 분리해 **플랫폼 간 디자인 패리티(parity)** 를 코드 레벨에서 보장했습니다. Turborepo의 태스크 캐싱으로 CI 시간도 단축했습니다.

## 시스템 아키텍처

[사진 준비중: 전체 시스템 아키텍처 다이어그램 (클라이언트 → CloudFront/Vercel → EC2(Docker) → PostgreSQL/Redis/S3, GitHub Actions → ECR → EC2 배포 흐름 포함)]

```
                        ┌─────────────────────────────┐
   Web (Next.js PWA)    │        AWS EC2 (Docker)      │
   Mobile (Expo)   ───▶ │  NestJS API  ◀──▶  Redis 7   │──▶ PostgreSQL 17
   Admin (Next.js)      │  (REST + Socket.IO)          │──▶ AWS S3 (사진/이미지)
                        └─────────────────────────────┘
                                    ▲
              GitHub Actions ──▶ AWS ECR (Docker 이미지)
```

- **API 서버**: NestJS 모듈 아키텍처 — auth, invitations, participants, date-vote, conversations(DM), locations, photos, settlements, notifications, weather, ai 등 **40여 개 도메인 모듈**로 관심사 분리
- **DB**: PostgreSQL 17 + Drizzle ORM — 모든 스키마 변경은 마이그레이션으로 관리, **Soft Delete 우선 정책**
- **Redis**: 캐시(cache-manager) · Socket.IO 어댑터 · BullMQ 큐 · Idempotency 응답 저장소 · 실시간 위치 버퍼 등 다목적 활용
- **스토리지**: S3 Presigned URL 업로드 (로컬 개발은 MinIO로 동일 인터페이스 재현)
- **관측성**: Sentry(에러 트래킹), 구조화 로깅(console.log 커밋 금지 → logger 강제)

## 인증 플로우

- 소셜 로그인 4종: **Google · Apple · Kakao · Naver** (Web/Mobile 동시 지원)
- JWT Access/Refresh + 세션 쿠키, 역할 기반 Guard(사용자/호스트/공동호스트/관리자)
- 신규 가입 vs 기존 계정 연결·병합 분기, Apple 숨김 이메일 정책 대응

[사진 준비중: 인증 Guard 플로우 다이어그램 (docs/architecture/guard-flow.png 활용 가능)]

---

# 6. 기술적으로 고민한 부분

## 6-1. 부하 테스트로 검증한 DB 인덱스 최적화 — "530배 빨라졌지만, 그게 전부가 아니었다"

**문제 인식**: 빈 DB에서는 풀스캔도 1ms 안에 끝나기 때문에 인덱스 유무가 성능에 미치는 영향을 측정할 수 없습니다. "인덱스를 걸었다"가 아니라 **"인덱스가 실제로 얼마나 개선했는지 숫자로 증명"** 하고 싶었습니다.

**접근**:
1. 시드 인프라를 확장해 **유저 1만 · 초대장 5천 · 참가자 18.7만 행** 규모의 데이터를 생성
2. 소셜 로그인만 존재하는 서비스 특성상 k6가 OAuth 플로우를 탈 수 없어, **시드 시점에 JWT를 직접 서명해 토큰 파일로 발급**하는 방식을 선택 (테스트용 백도어 엔드포인트를 프로덕션 코드에 넣는 대안은 기각)
3. k6로 VU 50 부하를 가하며 인덱스 추가 전후를 `EXPLAIN ANALYZE`와 함께 비교 측정

**결과**:

| 측정 | 인덱스 없음 | 인덱스 있음 | 개선 |
|---|---|---|---|
| `participants WHERE invitation_id` (18.7만 행) | 45.13ms | 0.085ms | **약 530배** |
| `invitations WHERE user_id` (2.5만 행) | 6.29ms | 0.23ms | 약 27배 |
| k6 API p95 응답 시간 | 42.25ms | 53.44ms | 유의미한 차이 없음 |

**배운 것**: 쿼리 레벨에서 530배 개선됐지만 **API 응답 시간 전체에서는 효과가 묻혔습니다.** NestJS 처리, JSON 직렬화, JWT 검증 등의 오버헤드가 지배적이었기 때문입니다. "성능 개선 = 인덱스 추가"라는 단순 공식이 아니라, **응답 경로 전체의 병목을 측정하고 지배 요인을 찾아야 한다**는 것을 데이터로 체득했습니다.

[사진 준비중: k6 부하 테스트 결과 그래프 / EXPLAIN ANALYZE 비교]

## 6-2. Idempotency-Key 전역 인터셉터 — 중복 요청으로부터 안전한 API

**문제 인식**: 모바일 환경의 불안정한 네트워크에서 재시도가 발생하면, 초대장 생성·정산 같은 변경 작업이 **중복 실행**될 수 있습니다.

**해결**:
- 모든 변경 요청에 `Idempotency-Key` 헤더를 요구하는 **NestJS 전역 인터셉터** 구현
- 처리 결과를 **Redis에 캐싱**하고, 동일 키 재요청 시 저장된 응답을 그대로 재생(replay) — 응답에 `Idempotency-Replayed` 헤더를 붙여 클라이언트가 재생 여부를 알 수 있게 설계
- 키 형식 검증, 동시 요청 경합 처리를 포함해 **단위 테스트 11케이스**로 엣지 케이스 검증

**의미**: 개별 엔드포인트마다 중복 방지 로직을 짜는 대신, **횡단 관심사를 인터셉터로 추상화**해 팀 전체의 API가 일관되게 멱등성을 보장하도록 했습니다.

## 6-3. 실시간 위치 공유의 프라이버시 설계 — 3단계 티어와 좌표 마스킹

**문제 인식**: "모임 당일 위치 공유"는 편리하지만, 정확한 위치가 그대로 노출되는 것에 부담을 느끼는 사용자가 있습니다. 편의와 프라이버시는 트레이드오프이므로 **노출 수준을 사용자가 선택**할 수 있어야 한다고 판단했습니다.

**해결** (3개의 PR로 단계적 강화: tier1 → tier2 → tier3):
- **3단계 티어**: `full`(정확 위치) / `distance`(대략 위치) / `hidden`(비공개)
- `distance` 티어는 좌표를 **약 1.1km 격자로 스냅**하고 정확도 반경을 최소 1km로 확대해, "근처에 있다" 수준만 전달되도록 서버에서 마스킹
- 유저 기본 티어 + 모임별 오버라이드 구조로, 모임마다 다른 공개 수준 설정 가능
- WebSocket `location:subscribe`에 **참가자 권한 검증**을 추가해 모임 외부인의 구독 차단
- 종료/삭제(soft-delete)된 초대장으로의 GPS upsert를 차단해 **데이터 수집 자체를 중단**

**설계 포인트**: 위치는 고빈도 쓰기 데이터라 **Redis에 버퍼링 후 스케줄러로 DB에 flush하는 write-behind 구조**를 적용해 DB 부하를 줄였고, 마스킹 로직은 순수 함수로 분리해 단위 테스트로 검증했습니다.

## 6-4. 외부 API 장애 격리 — 서킷 브레이커와 타임아웃 폴백

외부 의존성(OpenAI, 기상청 API, Redis)이 죽어도 **서비스 전체가 함께 죽지 않도록** 각 연동 지점에 장애 격리 장치를 두었습니다.

- **AI 이미지 생성 (OpenAI)**: 실패율이 임계치(60%)를 넘으면 서킷을 열어 일정 시간 호출을 차단하고 사용자에게 대체 옵션(기본 템플릿)을 안내. 쿨다운 후 자동 복구되는 **자체 구현 서킷 브레이커**
- **날씨 (기상청 KMA)**: Redis 캐시 우선 조회 + **캐시 조회에 500ms 타임아웃**을 걸어, Redis 장애 시 무한 대기 대신 즉시 KMA 원본 API로 폴백. 캐시 계층의 장애가 기능 장애로 번지지 않도록 설계
- **일일 사용량 제한**: AI 생성은 유저당 하루 3회로 제한해 비용 폭주 방지

**의미**: "연동했다"에서 끝나지 않고, **의존성이 실패하는 상황을 기본 시나리오로 가정**하고 설계했습니다.

## 6-5. 실시간 아키텍처 — Socket.IO 선택과 동시성 제어

**기술 선택**: 순수 WebSocket(재연결·룸 관리 직접 구현 부담) vs SSE(단방향이라 DM 부적합) vs **Socket.IO(재연결·하트비트·룸 추상화 내장)** 를 비교해 Socket.IO를 채택했습니다.

- **스케일 아웃 대비**: `@socket.io/redis-adapter`로 다중 인스턴스 간 이벤트 동기화 기반을 마련하되, **로컬 개발은 in-memory 어댑터**로 전환해 개발 응답성 확보 — 환경별 어댑터 전략 분리
- **1:1 DM 중복 방 생성 방지**: 두 사용자가 동시에 "대화 시작"을 누르면 방이 2개 생길 수 있는 레이스 컨디션을, `directKey = min(uidA):max(uidB)` 정규화 키 + **DB unique 제약**으로 차단 — 애플리케이션 락 대신 DB 제약으로 동시성을 해결한 사례
- WebSocket CORS 처리를 커스텀 IoAdapter로 일원화해 게이트웨이별 중복 설정 제거

## 6-6. 파일 업로드 파이프라인 — Presigned URL과 검증 계층

**문제 인식**: 모임 사진은 용량이 크고 동시 업로드가 몰립니다. 파일이 API 서버를 경유하면 서버가 병목이 됩니다.

**해결**:
- **S3 Presigned URL 방식**으로 클라이언트가 S3에 직접 업로드 → API 서버는 메타데이터만 처리
- 업로드 전 **클라이언트 이미지 압축**(browser-image-compression)으로 트래픽 절감
- 확장자 위조를 막기 위해 **파일 매직넘버 기반 타입 검증**(file-type)
- 조회 시에는 S3 key를 presigned URL로 변환해 응답 — 외부 URL(소셜 프로필 등)은 패스스루 처리하는 분기 설계
- 로컬 개발 환경은 **MinIO**로 S3 인터페이스를 동일하게 재현해, 환경 차이로 인한 버그 예방

## 6-7. 품질을 지키는 장치들

- **테스트 피라미드**: 단위 테스트(Jest/Vitest) + API E2E + 웹 Playwright E2E. DM, 위치 인증, S3, soft-delete 시나리오 등 **핵심 플로우를 E2E로 고정**해 회귀 방지
- **E2E 버그 로그 문서화**: 테스트로 발견한 버그를 `docs/integration/e2e-bug-log.md`에 기록하며 하드닝 스프린트 진행 (PR #242~#249)
- **Storybook**으로 UI 컴포넌트 문서화, 디자인 시스템과 실제 구현의 괴리 방지
- **보안 자동화**: CodeQL 정적 분석 + Gitleaks 시크릿 스캔을 CI에 내장, 비밀번호는 bcrypt 해시, 환경변수 하드코딩 금지 규칙
- **Sentry** 도입으로 프로덕션 에러를 실시간 추적

---

# 7. 사용한 기술과 배포

## 기술 스택

| Category | Stack |
|:---:|---|
| **Common** | ![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=nodedotjs&logoColor=white) ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white) ![pnpm](https://img.shields.io/badge/pnpm-F69220?style=flat&logo=pnpm&logoColor=white) ![Turborepo](https://img.shields.io/badge/Turborepo-EF4444?style=flat&logo=turborepo&logoColor=white) ![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=flat&logo=socketdotio&logoColor=white) ![ESLint](https://img.shields.io/badge/ESLint-4B32C3?style=flat&logo=eslint&logoColor=white) ![Prettier](https://img.shields.io/badge/Prettier-F7B93E?style=flat&logo=prettier&logoColor=black) ![Husky](https://img.shields.io/badge/Husky-42B983?style=flat&logo=git&logoColor=white) ![.ENV](https://img.shields.io/badge/.ENV-ECD53F?style=flat&logo=dotenv&logoColor=black) |
| **Frontend** | ![Next.js](https://img.shields.io/badge/Next.js_15-000000?style=flat&logo=nextdotjs&logoColor=white) ![React](https://img.shields.io/badge/React_19-61DAFB?style=flat&logo=react&logoColor=black) ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_4-06B6D4?style=flat&logo=tailwindcss&logoColor=white) ![TanStack Query](https://img.shields.io/badge/TanStack_Query-FF4154?style=flat&logo=reactquery&logoColor=white) ![Zustand](https://img.shields.io/badge/Zustand-443E38?style=flat&logo=react&logoColor=white) ![Radix UI](https://img.shields.io/badge/Radix_UI-161618?style=flat&logo=radixui&logoColor=white) ![Framer Motion](https://img.shields.io/badge/Framer_Motion-0055FF?style=flat&logo=framer&logoColor=white) ![Zod](https://img.shields.io/badge/Zod-3E67B1?style=flat&logo=zod&logoColor=white) ![Storybook](https://img.shields.io/badge/Storybook-FF4785?style=flat&logo=storybook&logoColor=white) ![PWA](https://img.shields.io/badge/PWA_(Serwist)-5A0FC8?style=flat&logo=pwa&logoColor=white) |
| **Backend** | ![NestJS](https://img.shields.io/badge/NestJS_11-E0234E?style=flat&logo=nestjs&logoColor=white) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL_17-4169E1?style=flat&logo=postgresql&logoColor=white) ![Drizzle ORM](https://img.shields.io/badge/Drizzle_ORM-C5F74F?style=flat&logo=drizzle&logoColor=black) ![Redis](https://img.shields.io/badge/Redis_7-FF4438?style=flat&logo=redis&logoColor=white) ![BullMQ](https://img.shields.io/badge/BullMQ-D93A3A?style=flat&logo=redis&logoColor=white) ![JWT](https://img.shields.io/badge/JWT-000000?style=flat&logo=jsonwebtokens&logoColor=white) ![Swagger](https://img.shields.io/badge/Swagger-85EA2D?style=flat&logo=swagger&logoColor=black) ![Sentry](https://img.shields.io/badge/Sentry-362D59?style=flat&logo=sentry&logoColor=white) |
| **Mobile** | ![Expo](https://img.shields.io/badge/Expo-000020?style=flat&logo=expo&logoColor=white) ![React Native](https://img.shields.io/badge/React_Native-61DAFB?style=flat&logo=react&logoColor=black) |
| **Testing** | ![Jest](https://img.shields.io/badge/Jest-C21325?style=flat&logo=jest&logoColor=white) ![Vitest](https://img.shields.io/badge/Vitest-6E9F18?style=flat&logo=vitest&logoColor=white) ![Playwright](https://img.shields.io/badge/Playwright-2EAD33?style=flat&logo=googlechrome&logoColor=white) ![k6](https://img.shields.io/badge/k6-7D64FF?style=flat&logo=k6&logoColor=white) |
| **Deployment** | ![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white) ![AWS EC2](https://img.shields.io/badge/AWS_EC2-FF9900?style=flat) ![AWS ECR](https://img.shields.io/badge/AWS_ECR-FF9900?style=flat) ![AWS S3](https://img.shields.io/badge/AWS_S3-569A31?style=flat) ![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-2088FF?style=flat&logo=githubactions&logoColor=white) |
| **Collaboration** | ![GitHub](https://img.shields.io/badge/GitHub-181717?style=flat&logo=github&logoColor=white) ![Notion](https://img.shields.io/badge/Notion-000000?style=flat&logo=notion&logoColor=white) ![Figma](https://img.shields.io/badge/Figma-F24E1E?style=flat&logo=figma&logoColor=white) ![Discord](https://img.shields.io/badge/Discord-5865F2?style=flat&logo=discord&logoColor=white) |
<br>

## 배포 파이프라인 (CI/CD)

[사진 준비중: CI/CD 파이프라인 다이어그램 (GitHub Actions → ECR → EC2)]

```
PR 생성 ──▶ CI (lint / typecheck / test / build) + CodeQL + Gitleaks
   │
   ▼ 리뷰 승인 & 머지
develop ──▶ main 머지 시
   │
   ▼ GitHub Actions (deploy.yml)
Docker 이미지 빌드 ──▶ AWS ECR 푸시 ──▶ EC2 SSH 접속
   │
   ▼
기존 컨테이너 교체 (docker pull → stop → run) + 이미지 정리
```

- **CI**: 모든 PR에서 `lint → typecheck → test → build` 필수 통과, PR 자동 어사인으로 리뷰 문화 정착
- **CD**: `main` 푸시 시 GitHub Actions가 API Docker 이미지를 빌드해 **AWS ECR**에 푸시하고, **EC2**에서 무중단에 가까운 컨테이너 교체 배포
- **환경 분리**: `docker-compose.yml`(로컬: Postgres/Redis/MinIO) / `docker-compose.prod.yml`(프로덕션), 환경변수는 `.env` 파일로 관리하며 시크릿 커밋은 Gitleaks로 차단
- **DB 마이그레이션**: 배포 파이프라인과 분리된 마이그레이션 스크립트로 프로덕션 스키마 변경을 통제

---

<div align="center">

**WARA — 요즘 모이는 방식** 🎉

[wara.kr](https://wara.kr) · [Issues](https://github.com/Wara-by-Gara/Wara/issues) · [Pull Requests](https://github.com/Wara-by-Gara/Wara/pulls)

</div>
