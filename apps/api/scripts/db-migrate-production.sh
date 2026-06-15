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

# migration 전에 이미 stop 된 상태면 RESTART_API가 안 잡혀 API가 계속 내려감 → 항상 기동 시도
if docker ps -a --format '{{.Names}}' | grep -qx wara-api; then
  if docker ps --format '{{.Names}}' | grep -qx wara-api; then
    echo "wara-api 이미 실행 중"
  else
    echo "wara-api 시작 중..."
    docker start wara-api
  fi

  echo "API health 대기 (최대 60초)..."
  for _ in $(seq 1 30); do
    if curl -sf http://127.0.0.1:3001/api/health >/dev/null 2>&1; then
      echo "API health OK"
      break
    fi
    sleep 2
  done
  if ! curl -sf http://127.0.0.1:3001/api/health >/dev/null 2>&1; then
    echo "경고: API health 실패 — docker logs wara-api --tail 80 확인" >&2
  fi
else
  echo "경고: wara-api 컨테이너 없음 — deploy 또는 docker run 으로 수동 기동 필요" >&2
fi

echo "완료"
