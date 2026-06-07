import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { and, eq, isNull } from 'drizzle-orm';
import * as schema from '../src/database/schema';
import { users } from '../src/database/schema';

/**
 * 기존(소셜 로그인) 유저를 최고 관리자(role=admin)로 승격하는 1회성 스크립트.
 *
 * 와라는 소셜 로그인 전용이라 별도 ID/PW 계정을 만들지 않는다.
 * 관리자는 "이미 소셜 로그인으로 가입한 유저"를 role=admin 으로 올려 지정한다.
 * (해당 이메일로 한 번이라도 소셜 로그인 한 적이 있어야 DB에 유저가 존재함)
 *
 * 사용:
 *   pnpm --filter api db:promote-admin               # 기본 이메일 사용
 *   pnpm --filter api db:promote-admin user@mail.com # 특정 이메일 승격
 *
 * 멱등: 이미 admin이어도 안전하게 재실행 가능.
 */
const DEFAULT_ADMIN_EMAIL = 'lareina7486@gmail.com';

async function main() {
  const email =
    process.argv[2] ?? process.env.ADMIN_EMAIL ?? DEFAULT_ADMIN_EMAIL;

  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL 환경변수가 설정되지 않았습니다.');

  const client = postgres(url);
  const db = drizzle(client, { schema, casing: 'snake_case' });

  try {
    const updated = await db
      .update(users)
      .set({ role: 'admin', promotedAt: new Date() })
      .where(and(eq(users.email, email), isNull(users.deletedAt)))
      .returning({ id: users.id, email: users.email, role: users.role });

    if (updated.length === 0) {
      process.stderr.write(
        `[promote-admin] ✗ '${email}' 유저를 찾지 못했습니다. ` +
          `해당 이메일로 먼저 소셜 로그인해 유저를 생성한 뒤 다시 실행하세요.\n`,
      );
      process.exitCode = 1;
      return;
    }

    process.stdout.write(
      `[promote-admin] ✓ '${updated[0]!.email}' → role=${updated[0]!.role} 승격 완료 (id=${updated[0]!.id})\n`,
    );
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  process.stderr.write(`[promote-admin] 오류: ${e instanceof Error ? e.message : String(e)}\n`);
  process.exit(1);
});
