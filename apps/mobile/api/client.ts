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

// 네트워크 hang 회피용 default timeout. 사진 업로드 같은 대용량 endpoint는
// 호출 측에서 명시적으로 override (예: timeoutMs: 60_000).
const DEFAULT_TIMEOUT_MS = 15_000;

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  /** 인증 헤더 자동 첨부 여부 (기본 true). 로그인/콜백 같은 공개 endpoint는 false */
  authenticated?: boolean;
  /** AbortSignal — TanStack Query가 자동 전달. timeout과 결합됨 */
  signal?: AbortSignal;
  /** ms 단위 timeout. 기본 15초. 0 또는 음수는 비활성 */
  timeoutMs?: number;
};

/**
 * 와라 API fetcher.
 *
 * - 응답 envelope({ success, data, error, meta })를 풀어서 `data`만 반환
 *   참고: 페이지네이션 응답(total/page/limit/totalPages)이 필요한 호출은
 *   별도 helper(apiFetchWithMeta — V1.0 페이지네이션 화면 PR에서 추가) 사용.
 *   현재 `apiFetch`는 meta 정보 손실됨.
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
  const {
    method = 'GET',
    body,
    authenticated = true,
    signal,
    timeoutMs = DEFAULT_TIMEOUT_MS,
  } = options;

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

  // 호출 측 signal과 timeout signal을 수동 결합. 어느 쪽이든 먼저 abort되면 fetch 취소.
  // (AbortSignal.any는 Hermes 호환 보장 안 되어 수동 결합 사용)
  const controller = new AbortController();
  const onAbort = () => controller.abort();
  signal?.addEventListener('abort', onAbort);
  const timeoutId =
    timeoutMs > 0 ? setTimeout(() => controller.abort(), timeoutMs) : null;

  const url = `${resolveBaseUrl()}${path}`;
  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (err) {
    if (controller.signal.aborted && signal?.aborted !== true) {
      throw new WaraNetworkError(
        `API 요청 timeout (${timeoutMs}ms 초과)`,
        err,
      );
    }
    throw new WaraNetworkError(
      'API 요청 실패 (서버 연결 불가 또는 네트워크 오류)',
      err,
    );
  } finally {
    if (timeoutId !== null) clearTimeout(timeoutId);
    signal?.removeEventListener('abort', onAbort);
  }

  // 204 No Content: body 없음. envelope 없이도 성공 (예: PATCH /logs/:logId/open).
  // 호출 측은 제네릭 T를 void로 두는 패턴.
  if (res.status === 204) {
    return undefined as T;
  }

  let raw: unknown;
  try {
    raw = await res.json();
  } catch (err) {
    throw new WaraNetworkError(
      `API 응답 JSON 파싱 실패 (status ${res.status})`,
      err,
    );
  }

  // envelope 형태(`{ success: boolean, ... }`) 가벼운 runtime 검증.
  // 강한 검증(필드 타입까지)은 호출 측 Zod 스키마로.
  if (
    raw === null ||
    typeof raw !== 'object' ||
    typeof (raw as { success?: unknown }).success !== 'boolean'
  ) {
    throw new WaraNetworkError(
      `API 응답이 envelope 형식이 아님 (status ${res.status})`,
    );
  }
  const json = raw as ApiResponse<T>;

  if (json.success) {
    return json.data;
  }

  // 실패 envelope → 도메인 에러
  // TODO(auth-kakao PR): code === 'TOKEN_EXPIRED' && status === 401일 때
  //   refresh token으로 access token 자동 갱신 후 원 요청 재시도.
  //   현재는 UI 레이어에서 catch 후 로그인 화면으로 리다이렉트하는 것이 fallback.
  throw new WaraApiError({
    code: json.error.code,
    type: json.error.type,
    message: json.error.message,
    status: res.status,
    details: json.error.details,
    requestId: json.meta?.requestId,
  });
}
