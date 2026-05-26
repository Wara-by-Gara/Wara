const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001') + '/api';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

interface ApiError {
  error?: { code?: string };
}

// 동시에 여러 요청이 401을 받아도 refresh는 한 번만 실행
let refreshPromise: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_URL}/auth/refresh`, {
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
    const err: ApiError = await res.clone().json();
    if (err.error?.code === "TOKEN_EXPIRED") {
      const refreshed = await tryRefresh();
      if (refreshed) {
        res = await fetchFn();
      }
    }
  }

  if (!res.ok) throw await res.json();
  if (res.status === 204) return undefined as T;
  const json: ApiResponse<T> = await res.json();
  return json.data;
}

export function apiGet<T>(path: string): Promise<T> {
  return request<T>(
    () => fetch(`${API_URL}${path}`, { credentials: "include" }),
  );
}

export function apiPost<T>(path: string, body?: unknown): Promise<T> {
  return request<T>(
    () => fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      credentials: "include",
    }),
  );
}

export function apiPatch<T>(path: string, body: unknown): Promise<T> {
  return request<T>(
    () => fetch(`${API_URL}${path}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      credentials: "include",
    }),
  );
}

export function apiPut<T>(path: string, body: unknown): Promise<T> {
  return request<T>(
    () => fetch(`${API_URL}${path}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      credentials: "include",
    }),
  );
}

export async function apiDelete(path: string): Promise<void> {
  await request<null>(
    () => fetch(`${API_URL}${path}`, {
      method: "DELETE",
      credentials: "include",
    }),
  );
}
