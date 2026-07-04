import Constants from 'expo-constants';

import { clearTokens, getAccessToken, getRefreshToken, setTokens } from './auth-storage';
import {
  WaraApiError,
  WaraNetworkError,
  type ApiMeta,
  type ApiResponse,
  type ApiSuccess,
} from './types';

// API base URL — app.config.ts의 expo.extra.apiUrl에서 옴.
// dev: origin만 들어옴(예: http://localhost:3001 또는 Android 에뮬레이터의 http://10.0.2.2:3001).
//      여기서 `/api` prefix를 붙여 NestJS setGlobalPrefix('api')와 맞춤.
// prod: EAS Secret 또는 .env로 주입.
function resolveBaseUrl(): string {
  const fromExtra = (Constants.expoConfig?.extra as { apiUrl?: string } | undefined)?.apiUrl;
  if (!fromExtra) {
    throw new Error(
      'API_URL이 설정되지 않았습니다. EXPO_PUBLIC_API_URL 환경변수 또는 app.config.ts extra.apiUrl 확인.',
    );
  }
  return fromExtra.replace(/\/+$/, '') + '/api';
}

const DEFAULT_TIMEOUT_MS = 15_000;

// ── 토큰 자동 갱신 ────────────────────────────────────────────────────────────
// 동시에 여러 요청이 401을 받아도 refresh는 한 번만 실행하도록 Promise를 공유.
let ongoingRefresh: Promise<boolean> | null = null;

async function doRefreshAccessToken(): Promise<boolean> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return false;
  try {
    const res = await fetch(`${resolveBaseUrl()}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ refreshToken }),
      credentials: 'omit',
    });
    const raw = (await res.json().catch(() => null)) as {
      success?: boolean;
      data?: { accessToken?: string; refreshToken?: string };
      error?: { code?: string };
    } | null;
    // SUSPICIOUS_REFRESH는 호출 측에서 분기할 수 있도록 false 반환 외에 토큰 제거까지 수행
    if (raw?.error?.code === 'SUSPICIOUS_REFRESH') {
      await clearTokens();
      return false;
    }
    if (!res.ok) return false;
    if (!raw?.success || !raw.data?.accessToken) return false;
    await setTokens({ accessToken: raw.data.accessToken, refreshToken: raw.data.refreshToken });
    return true;
  } catch {
    return false;
  }
}

function tryRefreshAccessToken(): Promise<boolean> {
  if (!ongoingRefresh) {
    ongoingRefresh = doRefreshAccessToken().finally(() => {
      ongoingRefresh = null;
    });
  }
  return ongoingRefresh;
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  /** 인증 헤더 자동 첨부 여부 (기본 true). 로그인/콜백 같은 공개 endpoint는 false */
  authenticated?: boolean;
  /** AbortSignal — TanStack Query가 자동 전달. timeout과 결합됨 */
  signal?: AbortSignal;
  /** ms 단위 timeout. 기본 15초. 0 또는 음수는 비활성 */
  timeoutMs?: number;
  /**
   * 멱등성 키. 변경 작업(POST 등)에 전달하면 `Idempotency-Key` 헤더로 보냄.
   * 서버는 같은 키의 진행 중 요청에 409 IDEMPOTENCY_IN_PROGRESS, 완료 응답은 replay.
   * refresh 재시도 시에도 같은 키가 유지된다.
   */
  idempotencyKey?: string;
  /** 화면 이탈 중에도 전송 보장 (좋아요 등 짧은 변경). RN에서 지원 시 적용. */
  keepalive?: boolean;
};

/** 멱등성 키 생성 — crypto.randomUUID가 없는 Hermes 환경 대비 폴백. */
export function newIdempotencyKey(): string {
  const g = globalThis as { crypto?: { randomUUID?: () => string } };
  if (g.crypto?.randomUUID) return g.crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * 와라 API 코어 fetcher — 성공 envelope(`{ success, data, meta }`) 전체를 반환.
 *
 * - 4xx/5xx envelope는 `WaraApiError`로 throw — UI는 `error.code`로 분기
 * - 네트워크 실패는 `WaraNetworkError`로 throw — 재시도/오프라인 표시 대상
 * - 인증 헤더(`Authorization: Bearer ...`) SecureStore 토큰으로 자동
 * - TOKEN_EXPIRED/INVALID 시 refresh 후 1회 재시도
 *
 * 공개 wrapper는 `apiFetch`(data만) / `apiFetchWithMeta`({data, meta}) 사용.
 */
async function apiRequestEnvelope<T>(
  path: string,
  options: RequestOptions = {},
): Promise<ApiSuccess<T>> {
  const {
    method = 'GET',
    body,
    authenticated = true,
    signal,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    idempotencyKey,
    keepalive,
  } = options;

  const headers: Record<string, string> = {
    Accept: 'application/json',
  };
  if (body !== undefined) {
    // 한국어 body 인코딩 안전망 — fetch 기본도 UTF-8이지만 명시
    headers['Content-Type'] = 'application/json; charset=utf-8';
  }
  if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;
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
      keepalive,
      // 모바일은 Bearer 토큰 인증만 사용 — 서버가 웹용으로 심은 쿠키가 iOS 쿠키 저장소에
      // 남아 실려가면 CSRF 가드(CSRF_INVALID_ORIGIN 403)에 걸리므로 쿠키 전송을 차단.
      credentials: 'omit',
      // RN 0.81의 fetch는 global.AbortSignal type을 요구하는데 DOM AbortSignal과
      // onabort 콜백 시그니처가 미묘하게 다름. RN runtime은 둘 다 처리하므로
      // unknown으로 우회 (런타임 안전).
      signal: controller.signal as unknown as RequestInit['signal'],
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
    return { success: true, data: undefined as T };
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
    return json;
  }

  // access token 만료/소실 → refresh 시도 후 원 요청 1회 재시도 (웹과 일관성)
  if (
    (json.error.code === 'TOKEN_EXPIRED' || json.error.code === 'TOKEN_INVALID') &&
    res.status === 401 &&
    authenticated
  ) {
    const refreshed = await tryRefreshAccessToken();
    if (refreshed) {
      return apiRequestEnvelope<T>(path, options);
    }
    // refresh도 실패하면 저장된 토큰 제거 (로그인 화면으로 자연스럽게 떨어지도록)
    await clearTokens();
  }

  // 도난 의심 토큰 재사용 감지 → 즉시 모든 토큰 제거. UI 라우팅/Alert은 호출 측에서 error.code로 분기.
  if (json.error.code === 'SUSPICIOUS_REFRESH') {
    await clearTokens();
  }

  throw new WaraApiError({
    code: json.error.code,
    type: json.error.type,
    message: json.error.message,
    status: res.status,
    details: json.error.details,
    requestId: json.meta?.requestId,
  });
}

/**
 * 와라 API fetcher — 성공 envelope에서 `data`만 반환.
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
  const res = await apiRequestEnvelope<T>(path, options);
  return res.data;
}

/**
 * 페이지네이션 응답용 fetcher — `data`와 `meta`(total/page/limit/totalPages/nextCursor 등)를
 * 함께 반환. `useInfiniteQuery`/오프셋 페이지네이션 화면에서 사용.
 *
 * 사용 예:
 *   const { data, meta } = await apiFetchWithMeta<PhotoDto[]>('/invitations/x/photos?page=1');
 *   const hasNext = (meta?.page ?? 1) < (meta?.totalPages ?? 1);
 */
export async function apiFetchWithMeta<T>(
  path: string,
  options: RequestOptions = {},
): Promise<{ data: T; meta?: ApiMeta }> {
  const res = await apiRequestEnvelope<T>(path, options);
  return { data: res.data, meta: res.meta };
}
