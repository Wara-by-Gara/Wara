import { API_BASE } from "../env";

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

interface ApiErrorBody {
  success: false;
  error?: { code?: string; type?: string; message?: string };
}

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

async function request<T>(fetchFn: () => Promise<Response>, path?: string): Promise<T> {
  let res = await fetchFn();

  if (res.status === 401) {
    const body: ApiErrorBody = await res.clone().json();
    const code = body.error?.code;
    if (code === "TOKEN_EXPIRED" || code === "TOKEN_INVALID") {
      if (path === "/users/me") throw new Error(code);
      const refreshed = await tryRefresh();
      if (refreshed) {
        res = await fetchFn();
      } else {
        window.location.href = '/login';
        throw new Error(code);
      }
    } else {
      window.location.href = '/login';
      throw new Error(code ?? 'UNAUTHORIZED');
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

export interface ApiPostOptions {
  idempotencyKey?: string;
}

export function apiPost<T>(
  path: string,
  body?: unknown,
  options?: ApiPostOptions,
): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (options?.idempotencyKey) {
    headers["Idempotency-Key"] = options.idempotencyKey;
  }
  return request<T>(
    () => fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers,
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
