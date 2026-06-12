/**
 * 프로덕션 최소 시드: 약관 + 초대 템플릿 + 미션 템플릿만 upsert.
 * 테스트 유저·초대장·사진 등 fixtures 대량 데이터는 넣지 않는다.
 *
 * EC2:
 *   pnpm exec dotenv -e /home/ubuntu/.env.production -- ts-node -r tsconfig-paths/register drizzle/seed/seed-essential.ts
 */
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from '../../src/database/schema';
import { seedEssential } from './tier0-users';

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL 환경변수가 설정되지 않았습니다.');

  const client = postgres(url);
  const db = drizzle(client, { schema, casing: 'snake_case' });
  const log = (msg: string) => process.stdout.write(`[seed-essential] ${msg}\n`);

  log('필수 시드 시작 (약관 · 초대 템플릿 · 미션 템플릿)...');
  await seedEssential(db);
  log('완료');
  await client.end();
}

main().catch((err: unknown) => {
  const e = err as { message?: string; code?: string };
  process.stderr.write(`[seed-essential] 오류: ${e.message ?? String(err)}\n`);
  if (e.code) process.stderr.write(`  code: ${e.code}\n`);
  process.exit(1);
});
