import { apiFetch } from './client';

type OAuthProvider = 'kakao' | 'naver';

export type AuthTokenResponse = {
  accessToken: string;
  refreshToken: string;
  isNew: boolean;
  needsProfileCompletion?: boolean;
};

export function getOAuthUrl(provider: OAuthProvider): Promise<{ url: string; state: string }> {
  return apiFetch(`/auth/${provider}/url?platform=mobile`, { authenticated: false });
}

export function postOAuthCallback(
  provider: OAuthProvider,
  code: string,
  state: string,
): Promise<AuthTokenResponse> {
  return apiFetch(`/auth/${provider}/callback?platform=mobile`, {
    method: 'POST',
    body: { code, state },
    authenticated: false,
  });
}

export function postRefreshToken(refreshToken: string): Promise<{
  accessToken: string;
  refreshToken: string;
  refreshExpiresIn: number;
}> {
  return apiFetch('/auth/refresh?platform=mobile', {
    method: 'POST',
    body: { refreshToken },
    authenticated: false,
  });
}

export function getAppleState(): Promise<{ state: string }> {
  return apiFetch('/auth/apple/state', { authenticated: false });
}

export function postAppleCallback(params: {
  id_token: string;
  code: string;
  state: string;
  user?: {
    name?: { firstName?: string; lastName?: string };
    email?: string;
  };
}): Promise<AuthTokenResponse> {
  return apiFetch('/auth/apple/callback', {
    method: 'POST',
    body: params,
    authenticated: false,
  });
}

export function postLogout(refreshToken: string): Promise<void> {
  return apiFetch('/auth/logout', {
    method: 'POST',
    body: { refreshToken },
    authenticated: false,
  });
}
