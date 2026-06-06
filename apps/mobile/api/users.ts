import { apiFetch } from './client';
import { getRefreshToken } from './auth-storage';

export interface Me {
  id: string;
  name: string | null;
  email: string | null;
  birthYear: number | null;
  nickname: string | null;
  profileImageUrl: string | null;
}

export interface UpdateMeInput {
  name?: string;
  email?: string;
  birthYear?: number;
}

export interface MySocial {
  id: string;
  provider: 'kakao' | 'naver' | 'google' | 'apple';
  createdAt: string;
  updatedAt: string;
}

export type WithdrawalReason = 'rarely' | 'alternative' | 'missing' | 'privacy' | 'etc';

export interface DeleteMeInput {
  reason?: WithdrawalReason;
  detail?: string;
}

export const userKeys = {
  all: ['users'] as const,
  me: () => [...userKeys.all, 'me'] as const,
  socials: () => [...userKeys.all, 'socials'] as const,
};

export function fetchMe(signal?: AbortSignal): Promise<Me> {
  return apiFetch<Me>('/users/me', { signal });
}

export function updateMe(body: UpdateMeInput): Promise<Me> {
  return apiFetch<Me>('/users/me', { method: 'PATCH', body });
}

export function deleteMe(body: DeleteMeInput = {}): Promise<void> {
  return apiFetch<void>('/users/me', { method: 'DELETE', body });
}

export function fetchMySocials(signal?: AbortSignal): Promise<MySocial[]> {
  return apiFetch<MySocial[]>('/users/me/socials', { signal });
}

export function deleteMySocial(provider: MySocial['provider']): Promise<void> {
  return apiFetch<void>(`/users/me/socials/${provider}`, { method: 'DELETE' });
}

// 모바일 추가 소셜 연결 — provider SDK로 받은 access/id token으로 직접 link
export function linkSocialWithToken(
  provider: MySocial['provider'],
  providerToken: string,
): Promise<{ provider: MySocial['provider'] }> {
  return apiFetch<{ provider: MySocial['provider'] }>(
    `/users/me/socials/${provider}/link/token`,
    { method: 'POST', body: { providerToken } },
  );
}

// SOCIAL_ALREADY_LINKED 응답 details.mergeToken으로 호출
export function mergeAccounts(mergeToken: string): Promise<{ mergedUserId: string }> {
  return apiFetch<{ mergedUserId: string }>('/users/me/merge', {
    method: 'POST',
    body: { mergeToken },
  });
}

export async function logout(): Promise<void> {
  // 모바일은 쿠키 X — refresh token을 body로 전송. 없어도 백엔드는 idempotent.
  const refreshToken = await getRefreshToken();
  await apiFetch<void>('/auth/logout', {
    method: 'POST',
    body: refreshToken ? { refreshToken } : {},
    authenticated: false,
  });
}
