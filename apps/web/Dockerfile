# ─── Stage 1: 빌드 ───────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/tsconfig/package.json packages/tsconfig/
COPY packages/eslint-config/package.json packages/eslint-config/
COPY apps/web/package.json apps/web/

RUN pnpm install --frozen-lockfile

COPY packages/ packages/
COPY apps/web/ apps/web/

RUN pnpm --filter @wara/web build

# ─── Stage 2: 실행 ───────────────────────────────────────────────────────────
# Next.js standalone 모드: 실행에 필요한 파일만 자동으로 모아줌
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# standalone 빌드 결과물 복사
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static apps/web/.next/static
COPY --from=builder /app/apps/web/public apps/web/public

EXPOSE 3000

CMD ["node", "apps/web/server.js"]
