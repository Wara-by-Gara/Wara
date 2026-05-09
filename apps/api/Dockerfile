# ─── Stage 1: 빌드 ───────────────────────────────────────────────────────────
# 소스 코드를 컴파일해서 dist/ 폴더를 만드는 단계
FROM node:20-alpine AS builder

# pnpm 설치 (우리 프로젝트의 패키지 매니저)
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# 의존성 파일만 먼저 복사 (캐시 최적화: 코드가 바뀌어도 의존성이 안 바뀌면 재설치 안 함)
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/tsconfig/package.json packages/tsconfig/
COPY packages/eslint-config/package.json packages/eslint-config/
COPY apps/api/package.json apps/api/

RUN pnpm install --frozen-lockfile

# 패키지 소스 복사 후 빌드
COPY packages/ packages/
COPY apps/api/ apps/api/

RUN pnpm --filter @wara/api build

# ─── Stage 2: 실행 ───────────────────────────────────────────────────────────
# 빌드 결과물(dist/)만 가져와서 실행하는 최소 이미지
FROM node:20-alpine AS runner

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# 프로덕션 의존성만 설치
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/tsconfig/package.json packages/tsconfig/
COPY packages/eslint-config/package.json packages/eslint-config/
COPY apps/api/package.json apps/api/

RUN pnpm install --frozen-lockfile --prod

# 빌드 결과물 복사
COPY --from=builder /app/apps/api/dist apps/api/dist

ENV NODE_ENV=production
EXPOSE 3001

CMD ["node", "apps/api/dist/main.js"]
