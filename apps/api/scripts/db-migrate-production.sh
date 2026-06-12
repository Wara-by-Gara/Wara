#!/usr/bin/env bash
# RDS 프로덕션 migration (EC2에서 실행)
# 사용: bash scripts/db-migrate-production.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="${WARA_ENV_FILE:-/home/ubuntu/.env.production}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "env 파일 없음: $ENV_FILE" >&2
  exit 1
fi

if [[ ! -f "$ROOT/drizzle/migrations/meta/_journal.json" ]]; then
  echo "journal 없음: drizzle/migrations/meta/_journal.json — git pull 후 재시도" >&2
  exit 1
fi

cd "$ROOT"

# .env.production은 source 하지 않음 (멀티라인·특수문자 값이 bash syntax error 유발)
load_database_url() {
  pnpm exec dotenv -e "$ENV_FILE" -- node -pe "process.env.DATABASE_URL ?? ''"
}

DATABASE_URL="$(load_database_url)"
if [[ -z "$DATABASE_URL" ]]; then
  echo "DATABASE_URL이 설정되지 않았습니다. ($ENV_FILE)" >&2
  exit 1
fi

echo "DATABASE_URL: $(echo "$DATABASE_URL" | sed 's/:\/\/[^:]*:[^@]*@/:\/\/***:***@/')"

BEFORE=$(docker run --rm postgres:17 psql "$DATABASE_URL" -tAc "SELECT COUNT(*) FROM drizzle.__drizzle_migrations;" 2>/dev/null || echo "?")
echo "적용 전 migration 수: $BEFORE"

# DDL lock 방지: API 중지 (실행 중이면)
if docker ps --format '{{.Names}}' | grep -qx wara-api; then
  echo "wara-api 중지 중..."
  docker stop wara-api
  RESTART_API=1
fi

echo "migration 적용 중... (파일별 진행 로그 출력)"
pnpm exec dotenv -e "$ENV_FILE" -- ts-node -r tsconfig-paths/register drizzle/run-migrations.ts

DATABASE_URL="$(load_database_url)"
AFTER=$(docker run --rm postgres:17 psql "$DATABASE_URL" -tAc "SELECT COUNT(*) FROM drizzle.__drizzle_migrations;")
echo "적용 후 migration 수: $AFTER"

if [[ "${RESTART_API:-}" == "1" ]]; then
  echo "wara-api 재시작 중..."
  docker start wara-api
fi

echo "완료"
