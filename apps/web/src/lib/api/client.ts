import { API_BASE } from "../env";
import { useAuthStore } from "@/stores/authStore";

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

interface ApiErrorBody {
  success: false;
  error?: { code?: string; type?: string; message?: string };
}

// 동시에 여러 요청이 401을 받아도 refresh는 한 번만 실행
let refreshPromise: Promise<boolean | 'suspicious'> | null = null;

async function tryRefresh(): Promise<boolean | 'suspicious'> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) return true;
      const body: ApiErrorBody = await res.clone().json().catch(() => ({ success: false } as ApiErrorBody));
      if (body.error?.code === 'SUSPICIOUS_REFRESH') return 'suspicious';
      return false;
    } catch {
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

async function request<T>(fetchFn: () => Promise<Response>, path?: string): Promise<T> {
  let res = await fetchFn();

  if (res.status === 401) {
    const body: ApiErrorBody = await res.clone().json();
    const code = body.error?.code;
    // TOKEN_EXPIRED: 토큰 만료 / TOKEN_INVALID: 쿠키 소멸 — 둘 다 refresh 시도
    if (code === "TOKEN_EXPIRED" || code === "TOKEN_INVALID") {
      // /users/me는 auth probe 용도로도 쓰이므로 refresh/redirect 없이 throw.
      // 세션 만료 시 다른 API 호출이 refresh를 트리거함.
      if (path === "/users/me") throw new Error(code);
      const refreshed = await tryRefresh();
      if (refreshed === true) {
        res = await fetchFn();
      } else {
        // refresh 실패 = 세션 종료. zustand 상태까지 동기화 후 로그인으로.
        // 도난 의심 시에는 사유를 query로 전달해 LoginContainer가 안내 toast를 띄움.
        await useAuthStore.getState().logout();
        window.location.href = refreshed === 'suspicious' ? '/login?reason=suspicious' : '/login';
        throw new Error(code);
      }
    } else if (code === 'SUSPICIOUS_REFRESH') {
      window.location.href = '/login?reason=suspicious';
      throw new Error(code);
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
    path,
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

export async function apiDelete(path: string, body?: unknown): Promise<void> {
  await request<null>(
    () => fetch(`${API_BASE}${path}`, {
      method: "DELETE",
      headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      credentials: "include",
    }),
  );
}
