import { API_BASE } from "../env";

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

interface ApiErrorBody {
  success: false;
  error?: { code?: string; type?: string; message?: string };
}

// 동시에 여러 요청이 401을 받아도 refresh는 한 번만 실행
let refreshPromise: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });
      return res.ok;
    } catch {
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

async function request<T>(fetchFn: () => Promise<Response>): Promise<T> {
  let res = await fetchFn();

  if (res.status === 401) {
    const body: ApiErrorBody = await res.clone().json();
    const code = body.error?.code;
    // TOKEN_EXPIRED: 토큰 만료 / TOKEN_INVALID: 쿠키 소멸 — 둘 다 refresh 시도
    if (code === "TOKEN_EXPIRED" || code === "TOKEN_INVALID") {
      const refreshed = await tryRefresh();
      if (refreshed) {
        res = await fetchFn();
      } else {
        window.location.href = '/login';
        throw new Error(code);
      }
    }
  }

  if (res.status === 403 && typeof window !== 'undefined') {
    const body: ApiErrorBody = await res.clone().json();
    const TERMS_AGREE_PATH = '/terms/agree';
    if (body.error?.code === 'TERMS_AGREEMENT_REQUIRED' && !window.location.pathname.startsWith(TERMS_AGREE_PATH)) {
      const returnTo = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = `${TERMS_AGREE_PATH}?returnTo=${returnTo}`;
    }
  }

  if (!res.ok) {
    const body: ApiErrorBody = await res.json();
    throw new Error(body.error?.code ?? 'UNKNOWN_ERROR');
  }
  if (res.status === 204) return undefined as T;
  const json: ApiResponse<T> = await res.json();
  return json.data;
}

export function apiGet<T>(path: string): Promise<T> {
  return request<T>(
    () => fetch(`${API_BASE}${path}`, { credentials: "include" }),
  );
}

export function apiPost<T>(path: string, body?: unknown): Promise<T> {
  return request<T>(
    () => fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      credentials: "include",
    }),
  );
}

export function apiPatch<T>(path: string, body: unknown): Promise<T> {
  return request<T>(
    () => fetch(`${API_BASE}${path}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      credentials: "include",
    }),
  );
}

export function apiPut<T>(path: string, body: unknown): Promise<T> {
  return request<T>(
    () => fetch(`${API_BASE}${path}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      credentials: "include",
    }),
  );
}

export async function apiDelete(path: string): Promise<void> {
  await request<null>(
    () => fetch(`${API_BASE}${path}`, {
      method: "DELETE",
      credentials: "include",
    }),
  );
}
