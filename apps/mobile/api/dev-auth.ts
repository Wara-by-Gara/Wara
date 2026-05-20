import { apiFetch } from './client';

// 개발 전용 — apps/api/src/dev/dev-auth.controller.ts의 시드 유저 토큰 발급 API.
// BE가 NODE_ENV=development일 때만 등록하므로 prod 빌드에선 404.

// 현재 GET /invitations이 host만 반환하므로 host 시드 유저 위주.
// guest 참가 목록 endpoint가 추가되거나 auth-kakao PR에서 실제 로그인이 들어오면 본 form은 제거.
export const DEV_USER_EMAILS = [
  'host1@wara.dev',
  'host2@wara.dev',
  'host3@wara.dev',
  'host4@wara.dev',
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
