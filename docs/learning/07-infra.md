# 07. 인프라

> Docker · nginx · EC2 · Redis · S3 · GitHub Actions. "이 코드가 운영에서 어떻게 살아 있는가".

---

## 1. 운영 토폴로지

```
[사용자]
   │
   │ HTTPS (api.wara.kr / www.wara.kr)
   ▼
[ AWS EC2 (Ubuntu) ]
   ├─ nginx                  # TLS 종료, 리버스 프록시
   │     ├─ www.wara.kr → wara-web 컨테이너 (3000)
   │     └─ api.wara.kr → wara-api 컨테이너 (3001)
   │
   ├─ Docker 네트워크 (wara-net)
   │   ├─ wara-api  (NestJS, 3001)
   │   ├─ wara-web  (Next.js standalone, 3000)
   │   └─ wara_redis (redis:7-alpine, 6379)
   │
   └─ ~/.env.production       # 환경변수
        ↑ 컨테이너에 --env-file로 주입

[ AWS RDS (PostgreSQL) ]   ← 외부 (별도 머신)
[ AWS S3 ]                  ← presigned URL로 직접 통신
[ OpenAI API ]              ← AI 합성
```

핵심:
- **단일 EC2** + Docker compose 식으로 컨테이너 3개
- Redis는 EC2 안에 같이 (별도 ElastiCache 안 씀)
- DB는 RDS (관리형)

---

## 2. Docker — 컨테이너로 묶기

### Multi-stage build (`apps/api/Dockerfile`)
```dockerfile
# Stage 1: 빌드
FROM node:20-alpine AS builder
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

# 의존성 파일만 먼저 복사 → 캐시 최적화
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/tsconfig/package.json packages/tsconfig/
COPY apps/api/package.json apps/api/
ENV HUSKY=0
RUN pnpm install --frozen-lockfile --ignore-scripts

COPY packages/ packages/
COPY apps/api/ apps/api/
RUN pnpm --filter @wara/api build

# Stage 2: 실행 (가벼운 이미지)
FROM node:20-alpine AS runner
WORKDIR /app
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/api/package.json apps/api/
RUN pnpm install --frozen-lockfile --prod --ignore-scripts
COPY --from=builder /app/apps/api/dist apps/api/dist
ENV NODE_ENV=production
EXPOSE 3001
CMD ["node", "apps/api/dist/main.js"]
```

### 왜 multi-stage인가
- **빌드용 의존성**(typescript, eslint 등)을 운영 이미지에서 제외 → 이미지 크기 1/3로
- 빌드 결과(`dist/`)만 runner stage에 복사

### 핵심 트릭
- 의존성 파일만 먼저 `COPY` → 소스가 바뀌어도 의존성이 그대로면 캐시 재사용
- `ENV HUSKY=0`: pnpm install 시 git hook 설치 스킵 (Docker엔 git이 없음)
- `--ignore-scripts`: postinstall 스크립트 차단 (보안 + 속도)

---

## 3. Docker 네트워크 (`wara-net`)

```bash
docker network create wara-net

docker run -d --name wara_redis --network wara-net \
  --restart unless-stopped -v wara_redis_data:/data \
  redis:7-alpine redis-server --appendonly yes

docker run -d --name wara-api --network wara-net \
  --restart unless-stopped --env-file ~/.env.production \
  -p 3001:3001 $ECR/wara-api:latest
```

### 왜 네트워크가 따로 필요?
- 같은 네트워크의 컨테이너는 **컨테이너 이름**으로 서로 호출 가능
- `REDIS_URL=redis://wara_redis:6379` (호스트 이름 = 컨테이너 이름)
- 외부에 노출 안 함 → 보안

### `--restart unless-stopped`
- 컨테이너가 죽으면 자동 재시작
- 단 명시적으로 `docker stop`한 경우는 재시작 안 함

### `--env-file ~/.env.production`
- 환경변수를 EC2 호스트의 파일에서 주입
- 시크릿이 이미지에 안 들어감 (이미지 유출돼도 키는 안 나옴)

---

## 4. nginx — TLS 종료 + 리버스 프록시

EC2에서 nginx가 80/443을 열고:
- **TLS 종료**: Let's Encrypt 인증서로 HTTPS 처리, 내부는 HTTP로 컨테이너에 전달
- **라우팅**:
  - `api.wara.kr` → `http://localhost:3001` (wara-api)
  - `www.wara.kr` → `http://localhost:3000` (wara-web)

### 왜 nginx가 필요?
- Node.js에서 직접 TLS도 가능하지만, 인증서 갱신·로깅·HTTP/2 지원 등은 nginx가 훨씬 안정적
- 정적 파일 캐시·압축도 nginx에 위임

---

## 5. CI/CD — GitHub Actions

`.github/workflows/deploy.yml`:
```yaml
on:
  push:
    branches: [main]

jobs:
  deploy:
    steps:
      - uses: actions/checkout@v4
      - uses: aws-actions/configure-aws-credentials@v4
      - uses: aws-actions/amazon-ecr-login@v2

      - name: Build and push
        run: |
          docker build -f apps/api/Dockerfile -t $ECR/$REPO:$SHA .
          docker push $ECR/$REPO:$SHA
          docker push $ECR/$REPO:latest

      - name: Deploy to EC2
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.EC2_HOST }}
          script: |
            aws ecr get-login-password | docker login ...
            docker pull $ECR/$REPO:latest
            docker stop wara-api || true
            docker rm wara-api || true
            docker run -d --name wara-api --network wara-net \
              --restart unless-stopped --env-file ~/.env.production \
              -p 3001:3001 $ECR/$REPO:latest
            docker image prune -f
```

### 흐름
1. `main`에 push → 자동 실행
2. AWS 인증
3. Docker 이미지 빌드 → ECR(AWS의 Docker 레지스트리) push
4. SSH로 EC2 접속 → 이미지 pull → 컨테이너 교체
5. 옛 이미지 정리(`docker image prune`)

### 무중단 배포가 아닌 점
- `docker stop` → `docker run` 사이 짧은 다운타임 있음
- 트래픽 적은 시점에 배포 또는 향후 blue-green / rolling 전환

### Workflow 종류
- `ci.yml` — PR마다 lint/typecheck/test
- `codeql.yml` — 코드 보안 분석
- `secret-scan.yml` — 시크릿 누출 감지
- `deploy.yml` — 운영 배포
- `auto-assign.yml` — PR 리뷰어 자동 지정

---

## 6. Redis — 두 가지 용도

### (1) BullMQ 잡 큐
- 이미지 처리(`image-processing-jobs`), AI 합성 잡 등
- 백그라운드 작업을 큐에 던지고 워커가 처리
- 실패 시 재시도, 백오프 정책

`apps/api/src/queues/queue.module.ts`가 BullMQ 모듈 등록.

### (2) 캐시 + 세션
- **`@nestjs/cache-manager` + `@keyv/redis`** (`app.module.ts:56`)
- Refresh token 저장 (sha256 해시 → user_id 매핑)
- 자주 조회되는 리소스 캐시

### (3) Socket.IO 어댑터
- `@socket.io/redis-adapter` (`apps/api/package.json:44`)
- 여러 서버 인스턴스 간 Socket.IO 이벤트 브로드캐스트 동기화 (현재 단일 인스턴스라 이론상 불필요하지만 향후 대비)

---

## 7. S3 — 사진·이미지 스토리지

### 사용처
- 프로필 이미지
- 초대장 메인 이미지 + 썸네일
- 사진 앨범 업로드
- AI 합성 결과

### Presigned URL 패턴
1. 클라이언트가 백엔드에 "사진 업로드할게" 요청
2. 백엔드가 S3에 직접 PUT할 수 있는 **presigned URL**을 만들어 반환
3. 클라이언트가 직접 S3로 PUT (백엔드 트래픽 안 거침)
4. 업로드 후 클라이언트가 백엔드에 "업로드 완료, key는 X" 통지
5. 백엔드가 매직넘버 sniff로 진짜 이미지인지 검증, DB에 메타 저장

→ 자세히는 [09. 사진 앨범](./09-photos-album.md).

### 코드 위치
- `apps/api/src/s3/` — 모듈
- `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner`

### 향후 lifecycle (todo 보류)
- `ai-generations/results/` 1시간 lifecycle rule → AWS 콘솔에서 설정

---

## 8. 환경변수 — `.env.production`

`main.ts:23`에서 부팅 시 검증:
- `JWT_ACCESS_SECRET` (32바이트 이상)
- `FRONTEND_URL`
- `COOKIE_SECRET`
- `DATABASE_URL`
- `REDIS_URL`

→ 운영 환경에서 없으면 즉시 종료. fallback 절대 없음.

`drizzle.config.ts:6`은 마이그레이션 실행 시 dotenv로 로드:
```ts
const envFile = process.env.DRIZZLE_ENV_FILE ?? (NODE_ENV === 'production' ? '.env.production' : '.env.development');
dotenv.config({ path: envFile });
```

---

## 9. 헬스체크

- `apps/api/src/health/` 모듈
- 엔드포인트(현재 정확한 경로 확인 필요 — todo에 있던 `/api/health` 404 이슈)
- 의도: DB·Redis 연결 상태 확인

운영에서는 nginx 또는 외부 모니터링(Sentry는 에러용)이 헬스체크 호출.

---

## 10. 모니터링 — Sentry

`apps/api/src/sentry/instrument.ts`:
- `Sentry.init`은 **다른 모듈 import보다 먼저** 실행 (`main.ts:3`이 instrument를 첫 줄에 import)
- 자동 계측: HTTP 요청, NestJS 에러
- 에러 발생 시 Sentry로 자동 전송 (prod + DSN 둘 다 있을 때만)

```ts
// main.ts:3
import './sentry/instrument';   // 첫 줄
import { NestFactory } from '@nestjs/core';
```

---

## 11. 로깅 — Pino

`app.module.ts:50` LoggerModule (nestjs-pino) 등록:
- JSON 로그 (운영 환경 — Sentry/CloudWatch에 적합)
- `pino-pretty` (dev 환경 — 사람이 읽기 좋게)
- `pino-http`로 요청 자동 로그

→ `console.log` 금지 (루트 CLAUDE.md), 항상 `Logger` 사용.

---

## 12. 흔한 함정

### `--env-file`로 변수 변경 후 컨테이너 재시작 안 함
환경변수는 컨테이너 시작 시 한 번만 읽음. 변경 후 `docker stop && run` 필요.

### `wara-net` 네트워크 안 만들고 `docker run`
컨테이너끼리 통신 안 됨 — Redis 연결 실패. 배포 전에 `docker network create wara-net` 확인.

### Docker 이미지에 secret이 들어감
`.env` 파일을 이미지에 `COPY`하지 말 것. `--env-file`로 런타임에만 주입.

### 마이그레이션 자동 실행 의존
deploy.yml에 migration 단계가 없음 — 배포 시 새 컬럼 쿼리하면 깨짐.
→ 별도 스크립트(`db-migrate-production.sh`)를 SSH로 먼저 실행. (todo의 "drizzle CI 자동 검증"이 이걸 자동화하려는 것)

---

## 13. 체크리스트

- [ ] Multi-stage Dockerfile이 왜 좋은지 안다
- [ ] `wara-net` 네트워크가 컨테이너 이름 통신을 가능하게 한다
- [ ] nginx가 TLS 종료를 한다는 의미를 안다
- [ ] Redis가 BullMQ + 캐시 + Socket.IO 어댑터로 쓰인다는 걸 안다
- [ ] S3 presigned URL 패턴을 그릴 수 있다
- [ ] `deploy.yml`이 main push로 트리거된다는 걸 안다

→ 다음: [08. 초대장 도메인](./08-invitations.md)
