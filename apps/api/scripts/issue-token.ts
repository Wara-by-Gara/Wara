/**
 * 로컬 개발용 토큰 발급 스크립트.
 * 이름/닉네임/이메일로 유저를 찾아 access(JWT) + refresh(opaque) 토큰을 발급한다.
 * refresh는 auth.service와 동일하게 sha256 해시를 Redis에 저장해 실제로 갱신/검증이 동작한다.
 *
 * 실행: pnpm db:issue-token "승우"
 *       pnpm db:issue-token guest003@wara.dev
 * access 만료는 dev 편의상 기본 7d (TOKEN_ACCESS_EXPIRES로 변경 가능).
 */
import postgres from 'postgres';
import Redis from 'ioredis';
import { sign } from 'jsonwebtoken';
import { createHash, randomBytes } from 'crypto';

async function main() {
  const query = process.argv[2];
  if (!query) throw new Error('사용법: pnpm db:issue-token "<이름|닉네임|이메일>"');

  const dbUrl = process.env.DATABASE_URL;
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!dbUrl) throw new Error('DATABASE_URL 미설정');
  if (!secret) throw new Error('JWT_ACCESS_SECRET 미설정');

  const accessExpiresSec = Number(process.env.TOKEN_ACCESS_EXPIRES_SEC ?? 7 * 24 * 60 * 60); // 기본 7d
  const refreshTtl = Number(process.env.JWT_REFRESH_EXPIRES_IN ?? 1209600);
  const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379';

  const sql = postgres(dbUrl);
  const like = `%${query}%`;
  const users = await sql<
    { id: string; name: string | null; nickname: string | null; email: string | null; role: string }[]
  >`
    SELECT id, name, nickname, email, role
    FROM users
    WHERE (name ILIKE ${like} OR nickname ILIKE ${like} OR email = ${query})
      AND deleted_at IS NULL
    ORDER BY created_at
  `;

  if (users.length === 0) {
    await sql.end();
    throw new Error(`'${query}'에 해당하는 유저를 찾지 못했습니다.`);
  }

  const redis = new Redis(redisUrl);
  const hashToken = (t: string) => createHash('sha256').update(t).digest('hex');

  for (const u of users) {
    // access: auth.module과 동일 시크릿/payload (id, role, scope)
    const accessToken = sign({ id: u.id, role: u.role, scope: [] }, secret, {
      expiresIn: accessExpiresSec,
    });

    // refresh: auth.service.issueRefreshToken과 동일 — 랜덤 토큰 + sha256 해시를 Redis에 저장
    const refreshToken = randomBytes(40).toString('hex');
    const tokenHash = hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + refreshTtl * 1000);
    const ttl = Math.max(1, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
    await redis
      .multi()
      .hset(`refresh:token:${tokenHash}`, {
        userId: u.id,
        expiresAt: expiresAt.toISOString(),
        deviceInfo: '',
        ipAddress: '',
      })
      .expire(`refresh:token:${tokenHash}`, ttl)
      .sadd(`refresh:user:${u.id}`, tokenHash)
      .expire(`refresh:user:${u.id}`, ttl)
      .exec();

    process.stdout.write(
      [
        '────────────────────────────────────────',
        `유저: ${u.name ?? '(이름없음)'} (@${u.nickname ?? '-'}) · ${u.email ?? '-'} · role=${u.role}`,
        `id: ${u.id}`,
        '',
        `ACCESS  (만료 ${accessExpiresSec}s):`,
        accessToken,
        '',
        `REFRESH (만료 ${refreshTtl}s, Redis 저장됨):`,
        refreshToken,
        '',
      ].join('\n'),
    );
  }

  await redis.quit();
  await sql.end();
}

main().catch((e) => {
  process.stderr.write(`[issue-token] 오류: ${e instanceof Error ? e.message : String(e)}\n`);
  process.exit(1);
});
