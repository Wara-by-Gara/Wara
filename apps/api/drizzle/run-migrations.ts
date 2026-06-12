/**
 * drizzle-kit migrate 대체.
 *
 * drizzle-kit은 __drizzle_migrations의 마지막 created_at만 보고
 * 그보다 when이 큰 migration을 한 트랜잭션에 몰아 실행한다.
 * RDS에 0000만 적용된 상태면 29개 migration이 한 번에 돌아가며 멈춘 것처럼 보인다.
 *
 * 이 스크립트는 hash 기준으로 migration 파일마다 개별 트랜잭션을 적용한다.
 */
import { config as loadDotenv } from 'dotenv';
import { existsSync, readFileSync } from 'node:fs';
import { readMigrationFiles } from 'drizzle-orm/migrator';
import postgres from 'postgres';
import path from 'path';
import {
  bootstrapLegacySchema,
  isLegacyBootstrappedDb,
} from './bootstrap-legacy-schema';

const MIGRATIONS_FOLDER = path.join(__dirname, 'migrations');
const MIGRATIONS_SCHEMA = 'drizzle';
const MIGRATIONS_TABLE = '__drizzle_migrations';

const IGNORABLE_PG_CODES = new Set([
  '42701', // duplicate_column
  '42710', // duplicate_object (enum label 등)
  '42P07', // duplicate_table
  '42704', // undefined_object (DROP IF NOT EXISTS 후속)
]);

function isIgnorableMigrationError(err: unknown): boolean {
  if (typeof err !== 'object' || err === null) return false;
  const e = err as { code?: string; message?: string };
  if (e.code && IGNORABLE_PG_CODES.has(e.code)) return true;
  const msg = e.message ?? '';
  return /already exists/i.test(msg);
}

async function execStatement(client: postgres.Sql, stmt: string): Promise<void> {
  try {
    await client.unsafe(stmt);
  } catch (err) {
    if (isIgnorableMigrationError(err)) {
      const message = err instanceof Error ? err.message : String(err);
      process.stdout.write(`[migrate]   notice (skip): ${message}\n`);
      return;
    }
    throw err;
  }
}

function resolveDatabaseUrl(): string {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  const apiRoot = path.join(__dirname, '..');
  const candidates = [
    process.env.WARA_ENV_FILE,
    path.join(apiRoot, '.env.production'),
    '/home/ubuntu/.env.production',
    path.join(apiRoot, '.env.development'),
  ].filter((p): p is string => typeof p === 'string' && existsSync(p));

  for (const envFile of candidates) {
    loadDotenv({ path: envFile });
    if (process.env.DATABASE_URL) {
      return process.env.DATABASE_URL;
    }
  }

  throw new Error(
    'DATABASE_URL 환경변수가 설정되지 않았습니다. WARA_ENV_FILE 또는 apps/api/.env.development를 확인하세요.',
  );
}

async function main(): Promise<void> {
  const url = resolveDatabaseUrl();

  const client = postgres(url, { max: 1, connect_timeout: 10 });

  try {
    await client`SELECT 1`;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(
      `DB 연결 실패 (${message}). 로컬은 docker compose up -d postgres 후 재시도하세요.`,
    );
  }

  await client.unsafe(`CREATE SCHEMA IF NOT EXISTS ${MIGRATIONS_SCHEMA}`);
  await client.unsafe(`
    CREATE TABLE IF NOT EXISTS ${MIGRATIONS_SCHEMA}.${MIGRATIONS_TABLE} (
      id SERIAL PRIMARY KEY,
      hash text NOT NULL,
      created_at bigint
    )
  `);

  const appliedRows = await client.unsafe<{ hash: string }[]>(
    `SELECT hash FROM ${MIGRATIONS_SCHEMA}.${MIGRATIONS_TABLE}`,
  );
  const appliedHashes = new Set(appliedRows.map((r) => r.hash));

  const migrations = readMigrationFiles({ migrationsFolder: MIGRATIONS_FOLDER });
  const journalPath = path.join(MIGRATIONS_FOLDER, 'meta/_journal.json');
  const journal = JSON.parse(readFileSync(journalPath, 'utf8')) as {
    entries: Array<{ tag: string; when: number }>;
  };
  const whenByTag = new Map(journal.entries.map((e) => [e.tag, e.when]));

  let applied = 0;
  let skipped = 0;

  if (migrations.length !== journal.entries.length) {
    throw new Error(
      `journal(${journal.entries.length})와 migration 파일(${migrations.length}) 개수가 다릅니다.`,
    );
  }

  const legacyDb = await isLegacyBootstrappedDb(client);
  const firstMigration = migrations[0];
  if (
    legacyDb &&
    firstMigration &&
    !appliedHashes.has(firstMigration.hash)
  ) {
    await bootstrapLegacySchema(client);
  }

  for (let i = 0; i < migrations.length; i++) {
    const migration = migrations[i]!;
    const tag = journal.entries[i]!.tag;

    if (appliedHashes.has(migration.hash)) {
      skipped += 1;
      process.stdout.write(`[migrate] skip ${tag}\n`);
      continue;
    }

    const statements = migration.sql.map((s) => s.trim()).filter((s) => s.length > 0);
    process.stdout.write(`[migrate] apply ${tag} (${statements.length} statements)...\n`);

    const createdAt = whenByTag.get(tag) ?? migration.folderMillis;

    for (const stmt of statements) {
      await execStatement(client, stmt);
    }
    await client.unsafe(
      `INSERT INTO ${MIGRATIONS_SCHEMA}.${MIGRATIONS_TABLE} (hash, created_at) VALUES ($1, $2)`,
      [migration.hash, createdAt],
    );

    applied += 1;
    process.stdout.write(`[migrate] ✓ ${tag}\n`);
  }

  const total = await client.unsafe<{ count: string }[]>(
    `SELECT COUNT(*)::text AS count FROM ${MIGRATIONS_SCHEMA}.${MIGRATIONS_TABLE}`,
  );

  process.stdout.write(
    `[migrate] 완료 — 이번 적용: ${applied}, 스킵: ${skipped}, DB 기록: ${total[0]?.count ?? '?'}\n`,
  );

  await client.end();
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  process.stderr.write(`[migrate] 오류: ${message}\n`);
  process.exit(1);
});
