import { apiFetch } from './client';

// 개발 전용 — apps/api/src/dev/dev-auth.controller.ts의 시드 유저 토큰 발급 API.
// BE가 NODE_ENV=development일 때만 등록하므로 prod 빌드에선 404.

// 현재 GET /invitations이 host만 반환하므로 host 시드 유저 위주.
// guest 참가 목록 endpoint가 추가되거나 auth-kakao PR에서 실제 로그인이 들어오면 본 form은 제거.
// DB seed 패턴(`host${N.padStart(3, '0')}@wara.dev`)과 동기화 필요.
// apps/api/drizzle/seed/fixtures.ts:238 + apps/api/src/dev/dev-auth.service.ts:DEV_USER_WHITELIST
export const DEV_USER_EMAILS = [
  'host001@wara.dev',
  'host002@wara.dev',
  'host003@wara.dev',
  'host004@wara.dev',
  'admin@wara.dev',
] as const;

export type DevUserEmail = (typeof DEV_USER_EMAILS)[number];

/**
 * 시드 유저 이메일로 dev 토큰 발급. SecureStore 저장은 호출 측에서.
 */
export function issueDevToken(email: DevUserEmail) {
  return apiFetch<{ accessToken: string }>('/auth/dev/token', {
    method: 'POST',
    body: { email },
    authenticated: false,
  });
}
