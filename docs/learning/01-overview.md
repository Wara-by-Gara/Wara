# 01. 프로젝트 개요

> "WARA는 모임 초대장 서비스다"라고 한 줄로 말할 수 있지만, 그 한 줄 뒤에 어떤 시스템이 있는지가 이 챕터의 주제다.

---

## 1. WARA가 뭘 만드는가

**한 줄 요약**: 모임을 만들고, 친구들을 초대하고, 함께 사진을 남기는 서비스.

핵심 사용자 시나리오:

1. **호스트**가 모임 초대장을 만든다 (AI로 메인 이미지 생성 가능)
2. **게스트**들에게 링크/카카오톡으로 초대장 전송
3. **날짜 투표**로 모임 날짜 확정
4. **DM**으로 게스트들과 1:1 또는 단톡 채팅
5. **실시간 위치 공유**로 누가 어디 있는지 확인 (모임 당일)
6. **사진 앨범**으로 모임 후 사진 공유 + 베스트 9 자동 선정 (리마인드)

이 흐름이 6개의 핵심 도메인을 만든다: **invitations / participants / date-vote / conversations / locations / photos**.

→ Part 3 (08~12 챕터)에서 각 도메인을 자세히 본다.

---

## 2. 시스템 한눈에

```
┌──────────────────────────┐         ┌──────────────────────────┐
│  apps/web (Next.js 15)   │         │ apps/mobile (RN/Expo)    │
│  - App Router            │         │ - iOS, Android           │
│  - 카카오 비즈앱 X        │         │ - 카카오·네이버·구글·애플 │
│  - 호스트/관리자 위주     │         │ - 게스트 위주             │
└────────────┬─────────────┘         └────────────┬─────────────┘
             │                                    │
             │       HTTPS (https://api.wara.kr)  │
             └────────────────┬───────────────────┘
                              │
                      ┌───────▼────────────┐
                      │  nginx (TLS 종료)  │
                      └───────┬────────────┘
                              │
                      ┌───────▼─────────────────────┐
                      │ apps/api (NestJS 11)        │
                      │ - REST + Socket.IO          │
                      │ - Drizzle ORM               │
                      └───┬────────┬────────┬───────┘
                          │        │        │
                  ┌───────▼──┐ ┌───▼──┐ ┌───▼─────────┐
                  │PostgreSQL│ │Redis │ │  S3 + OpenAI│
                  │(RDS)     │ │(EC2) │ │  (외부 API) │
                  └──────────┘ └──────┘ └─────────────┘
```

- **`apps/web`**: 호스트가 PC에서 초대장 만들고 관리하는 화면.
- **`apps/mobile`**: 게스트들이 주로 쓰는 모바일 앱 (React Native + Expo).
- **`apps/api`**: NestJS 백엔드. HTTP API + WebSocket(Socket.IO)을 한 프로세스에서 처리.
- **Redis**: 두 가지 용도 — (1) BullMQ 잡 큐 (2) 캐시·세션. `--network wara-net`로 컨테이너 통신.
- **S3**: 사진·AI 결과물 저장. Presigned URL로 직접 업로드/다운로드.
- **OpenAI**: AI 초대장 메인 이미지 생성 (10번 챕터 참조).

→ 인프라 자세한 그림은 [07. 인프라](./07-infra.md).

---

## 3. 기술 스택 한눈에

### 백엔드 (`apps/api`)
| 역할 | 도구 |
|---|---|
| 프레임워크 | NestJS 11 (Express 어댑터) |
| 언어 | TypeScript |
| ORM | Drizzle ORM 0.45 + `postgres` 드라이버 |
| 인증 | 자체 OAuth 인증 + JWT (`jsonwebtoken`) |
| 검증 | Zod (Body), class-validator (DTO 일부) |
| 실시간 | Socket.IO + Redis adapter |
| 큐 | BullMQ (Redis 기반) |
| 캐시 | `@nestjs/cache-manager` + `@keyv/redis` |
| Rate limit | `@nestjs/throttler` |
| 로깅 | `nestjs-pino` |
| 모니터링 | Sentry |
| 스토리지 | AWS S3 (`@aws-sdk/client-s3`) |

### 프론트엔드 (`apps/web`)
| 역할 | 도구 |
|---|---|
| 프레임워크 | Next.js 15 (App Router, Turbopack) |
| 런타임 | React 19 |
| 서버 상태 | TanStack React Query v5 |
| 클라이언트 상태 | Zustand 5 (선택 도메인) |
| 스타일 | Tailwind CSS v4 (`@theme inline`) |
| 폼 | React Hook Form + Zod |
| 모킹 | MSW 2 |
| 테스트 | Vitest, Playwright |
| 컴포넌트 | Radix UI + 자체 컴포넌트 |
| 컨텐츠 | react-markdown, exifr (EXIF 파싱) |

### 인프라
- **EC2 (Ubuntu) + Docker** — `wara-net` 네트워크에서 컨테이너 통신
- **AWS RDS PostgreSQL** — DB
- **nginx** — TLS 종료, 리버스 프록시
- **GitHub Actions** — `deploy.yml`로 EC2 배포
- **Sentry** — 백엔드 오류 추적

→ 각각의 "왜 이걸 골랐나"는 Part 2 챕터들에서.

---

## 4. 코드 디렉터리 한눈에

```
wara/
├── apps/
│   ├── api/          # NestJS 백엔드
│   │   ├── src/
│   │   │   ├── auth/       # 인증
│   │   │   ├── invitations/# 초대장 (핵심 도메인)
│   │   │   ├── photos/     # 사진 앨범
│   │   │   ├── ai/         # AI 합성
│   │   │   ├── ...         # 40개 가까운 도메인 모듈
│   │   │   ├── database/   # Drizzle 스키마
│   │   │   ├── common/     # 인터셉터/필터/가드/에러 코드
│   │   │   ├── main.ts     # 부트스트랩 (143줄)
│   │   │   └── app.module.ts # 루트 모듈
│   │   └── drizzle/        # migration, seed
│   ├── web/          # Next.js 프론트
│   │   └── src/
│   │       ├── app/        # App Router 페이지
│   │       ├── components/ # 공유 UI
│   │       ├── domain/     # 도메인별 로직
│   │       ├── lib/        # apiClient, jwt
│   │       └── screens/    # 페이지 단위 컴포넌트
│   └── mobile/       # React Native (Expo)
├── packages/         # 워크스페이스 공유 패키지
│   ├── tsconfig/     # TS 공통 설정
│   └── eslint-config/# ESLint 공통 설정
└── docs/             # 설계 문서
    ├── api/          # API 설계서
    ├── db/           # ERD
    ├── conventions/  # 에러코드 등
    ├── decisions/    # ADR (의사결정 기록)
    └── learning/     # ← 지금 이 문서
```

→ 자세한 모노레포 동작 원리는 [02. 모노레포](./02-monorepo.md).

---

## 5. 요청 1건의 라이프사이클 (맛보기)

`POST /api/auth/kakao/token`이 들어왔다고 상상해보자.

1. **nginx**가 TLS 종료 → `localhost:3000`으로 프록시
2. **Express 미들웨어** (`main.ts:43` `helmet` → `compression` → CORS → `cookieParser` → CSRF 검증)
3. **NestJS 라우팅** — `AuthController.mobileTokenLogin()`
4. **Pipe** — `ZodValidationPipe`가 body를 zod 스키마로 검증
5. **Guard** — `@Public()`이면 통과, 아니면 `JwtAuthGuard`로 토큰 검증
6. **Service** — `AuthService.socialLoginWithProviderToken()`이 비즈니스 로직
7. **Repository** — Drizzle로 DB query
8. **Interceptor** — `ResponseFormatInterceptor`가 응답을 `{ success: true, data }`로 래핑
9. **Filter** — 예외 발생 시 `HttpExceptionFilter`가 `{ success: false, error }`로 변환

→ 13~14 챕터에서 이 흐름을 코드 한 줄씩 따라간다.

---

## 6. 이 챕터에서 알아야 할 것 (체크리스트)

- [ ] WARA가 만드는 서비스를 한 줄로 설명할 수 있다
- [ ] 6개 핵심 도메인 이름을 댈 수 있다 (invitations / participants / date-vote / conversations / locations / photos)
- [ ] `apps/`에 3개 앱이 있고 각각 뭘 하는지 안다
- [ ] 백엔드는 NestJS + Drizzle + PostgreSQL이라는 걸 안다
- [ ] 프론트는 Next.js 15 App Router + TanStack Query라는 걸 안다
- [ ] Redis가 큐 + 캐시 두 가지로 쓰인다는 걸 안다

→ 다음: [02. 모노레포 구조](./02-monorepo.md)
