import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

/**
 * 초대장 입장 비밀번호 해시 — scrypt(`salt:hash` 형식).
 * 사용자 계정 비밀번호가 아닌 초대장 접근 코드용. 평문 저장 금지.
 */
export function hashAccessPassword(plain: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(plain, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyAccessPassword(plain: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const derived = scryptSync(plain, salt, 64);
  const expected = Buffer.from(hash, 'hex');
  if (derived.length !== expected.length) return false;
  return timingSafeEqual(derived, expected);
}
