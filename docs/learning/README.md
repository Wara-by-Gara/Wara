# WARA 학습 가이드

WARA 프로젝트를 교재 삼아 모던 풀스택 개발을 배운다.
**대상 독자**: TypeScript 기본 문법은 알지만 NestJS·Drizzle·Next.js App Router 같은 프레임워크/도구의 "왜"가 흐릿한 사람.

---

## 어떻게 읽을까

각 챕터는 다음 세 부분으로 구성된다.

1. **왜 이게 필요한가** — 문제 인식
2. **우리 코드는 어떻게 했나** — 실제 설계 결정
3. **파일 경로 + 줄 번호** — 직접 코드를 열어볼 수 있는 좌표

코드 인용은 `apps/api/src/main.ts:39` 같은 형식으로 표기한다. VS Code/터미널에서 그대로 누르면 점프.

---

## 추천 학습 순서

### 빠른 코스 (전체 그림만 — 약 2시간)
Part 1 → 03 → 04 → 08

> 모노레포가 뭔지 → NestJS 기본 → DB 다루는 법 → 핵심 도메인 1개.

### 정석 코스 (Part별 차례대로 — 약 2~3일)
Part 1 → Part 2 → Part 3 → Part 4 → Part 5 → Part 6

> 큰 그림 → 스택 → 도메인 → 코드 따라가기 → 운영·도구 심화 → Claude 활용·거버넌스.

### 디버깅·이슈 추적 코스 (당장 코드 읽어야 할 때)
13 → 14 → 03 → 필요한 도메인 챕터

> 실제 request 흐름 → 에러 흐름 → NestJS 기본 → 보고 있는 도메인.

### 성능·운영 코스
16 → 17 → 07 → 04

> 부하 테스트로 병목 찾기 → Redis·BullMQ 심화 → 인프라 → DB 인덱스.

### Claude·문서 코스 (이 프로젝트를 LLM과 효율적으로 작업)
18 → 19 → 21 → 20

> Claude Code 활용법 → Skill 만들기 → 거버넌스·ADR → 작은 패턴들.

---

## 챕터 목록

### Part 1 — 큰 그림
- [01. 프로젝트 개요](./01-overview.md) — WARA가 뭘 만드는 서비스인지, 전체 아키텍처
- [02. 모노레포 구조](./02-monorepo.md) — pnpm workspace, Turbo

### Part 2 — 기술 스택
- [03. NestJS 기본기](./03-nestjs-basics.md) — Module/Controller/Service, DI, decorator
- [04. Drizzle + PostgreSQL](./04-drizzle-postgres.md) — 스키마 → migration → seed 사이클
- [05. 인증 시스템](./05-auth.md) — OAuth state, JWT, refresh rotation, CSRF
- [06. 프론트엔드 스택](./06-frontend-stack.md) — Next.js App Router, TanStack Query, Zustand, MSW
- [07. 인프라](./07-infra.md) — Docker, nginx, EC2, Redis, S3 presigned

### Part 3 — 도메인 로직
- [08. 초대장 도메인](./08-invitations.md) — 핵심 비즈니스, host/guest role, 낙관적 락
- [09. 사진 앨범](./09-photos-album.md) — S3 presigned, 매직넘버 sniff, 중복 감지
- [10. AI 이미지 합성](./10-ai-generation.md) — OpenAI, 일일 한도, 서킷 브레이커
- [11. 실시간 (DM/위치)](./11-realtime-dm-location.md) — Socket.IO, conversation 모델
- [12. 날짜 투표](./12-date-vote.md) — 슬롯·마감·확정 플로우

### Part 4 — 실제 코드 따라가기
- [13. 로그인 요청 워크스루](./13-walkthrough-login.md) — 카카오 로그인 1건이 들어와 나갈 때까지
- [14. 에러 흐름](./14-error-flow.md) — ErrorCode → 서비스 throw → 인터셉터 → 클라이언트
- [15. 테스트 전략](./15-testing.md) — 단위·통합·E2E, MSW, 픽스처

### Part 5 — 운영·도구 심화
- [16. 부하 테스트 (k6)](./16-load-testing-k6.md) — VU/p95/p99, WARA 실측 530배 인덱스 효과
- [17. Redis & BullMQ 심화](./17-redis-bullmq-deep.md) — 한 Redis가 4역할, 큐 워커 패턴

### Part 6 — Claude·거버넌스·잡학
- [18. Claude Code로 작업하기](./18-claude-code-workflow.md) — CLAUDE.md 계층, 메모리, plan/task
- [19. Skill 만들기](./19-skill-authoring.md) — `.claude/skills/` 구조, description 트리거
- [20. 작은 패턴 모음](./20-small-patterns.md) — ULID, Idempotency-Key, Zod, Pino, Sentry, soft delete
- [21. 거버넌스 & 의사결정](./21-governance.md) — ADR, SoT 지도, error-codes 동기화, CI 보안

---

## 함께 참고하면 좋은 문서

- **루트 [CLAUDE.md](../../CLAUDE.md)** — 프로젝트 작업 규칙
- **[api/WARA_API_설계_v0.7.md](../api/WARA_API_설계_v0.7.md)** — API 스펙
- **[db/WARA_ERD_v0.6.1.md](../db/WARA_ERD_v0.6.1.md)** — DB ERD
- **[conventions/error-codes.md](../conventions/error-codes.md)** — 에러 코드 표
- **[apps/api/CLAUDE.md](../../apps/api/CLAUDE.md)** — 백엔드 규칙
- **[apps/web/CLAUDE.md](../../apps/web/CLAUDE.md)** — 프론트 규칙

학습 문서가 코드와 어긋난다면 **코드가 정답**. 문서를 발견 즉시 갱신하자.
