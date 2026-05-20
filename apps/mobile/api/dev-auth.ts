import { apiFetch } from './client';

// 개발 전용 — apps/api/src/dev/dev-auth.controller.ts의 시드 유저 토큰 발급 API.
// BE가 NODE_ENV=development일 때만 등록하므로 prod 빌드에선 404.

export const DEV_USER_EMAILS = [
  'host1@wara.dev',
  'host2@wara.dev',
  'host3@wara.dev',
  'host4@wara.dev',
  'guest01@wara.dev',
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
