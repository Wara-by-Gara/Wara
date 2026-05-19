import Constants from 'expo-constants';

import { getAccessToken } from './auth-storage';
import { WaraApiError, WaraNetworkError, type ApiResponse } from './types';

// API base URL — app.config.ts의 expo.extra.apiUrl에서 옴.
// dev: 보통 http://localhost:3000/api/v1, prod: EAS Secret 또는 .env로 주입.
function resolveBaseUrl(): string {
  const fromExtra = (Constants.expoConfig?.extra as { apiUrl?: string } | undefined)?.apiUrl;
  if (fromExtra) return fromExtra;
  throw new Error(
    'API_URL이 설정되지 않았습니다. EXPO_PUBLIC_API_URL 환경변수 또는 app.config.ts extra.apiUrl 확인.',
  );
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  /** 인증 헤더 자동 첨부 여부 (기본 true). 로그인/콜백 같은 공개 endpoint는 false */
  authenticated?: boolean;
  /** AbortSignal — TanStack Query가 자동 전달 */
  signal?: AbortSignal;
};

/**
 * 와라 API fetcher.
 *
 * - 응답 envelope({ success, data, error, meta })를 풀어서 `data`만 반환
 * - 4xx/5xx envelope는 `WaraApiError`로 throw — UI는 `error.code`로 분기
 * - 네트워크 실패는 `WaraNetworkError`로 throw — 재시도/오프라인 표시 대상
 * - 인증 헤더(`Authorization: Bearer ...`) SecureStore 토큰으로 자동
 *
 * 사용 예:
 *   const me = await apiFetch<UserDto>('/users/me');
 *   const created = await apiFetch<InvitationDto>('/invitations', {
 *     method: 'POST',
 *     body: { title, ... },
 *   });
 */
export async function apiFetch<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = 'GET', body, authenticated = true, signal } = options;

  const headers: Record<string, string> = {
    Accept: 'application/json',
  };
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (authenticated) {
    const token = await getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const url = `${resolveBaseUrl()}${path}`;
  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  } catch (err) {
    throw new WaraNetworkError(
      'API 요청 실패 (서버 연결 불가 또는 네트워크 오류)',
      err,
    );
  }

  let json: ApiResponse<T>;
  try {
    json = (await res.json()) as ApiResponse<T>;
  } catch (err) {
    throw new WaraNetworkError(
      `API 응답 JSON 파싱 실패 (status ${res.status})`,
      err,
    );
  }

  if (json.success) {
    return json.data;
  }

  // 실패 envelope → 도메인 에러
  throw new WaraApiError({
    code: json.error.code,
    type: json.error.type,
    message: json.error.message,
    status: res.status,
    details: json.error.details,
    requestId: json.meta?.requestId,
  });
}
