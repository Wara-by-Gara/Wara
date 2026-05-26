const API_URL = `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"}/api`;

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

interface ApiError {
  error?: { code?: string };
}

// 동시에 여러 요청이 401을 받아도 refresh는 한 번만 실행
let refreshPromise: Promise<string | null> | null = null;

async function tryRefresh(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refreshToken = localStorage.getItem("refresh_token");
    if (!refreshToken) return null;

    try {
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) {
        // SUSPICIOUS_REFRESH 등 갱신 실패 → 강제 로그아웃
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        return null;
      }
      const json: ApiResponse<{ accessToken: string; refreshToken: string }> = await res.json();
      localStorage.setItem("access_token", json.data.accessToken);
      localStorage.setItem("refresh_token", json.data.refreshToken);
      return json.data.accessToken;
    } catch {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

async function request<T>(fetchFn: (token?: string) => Promise<Response>, token?: string): Promise<T> {
  let res = await fetchFn(token);

  if (res.status === 401) {
    const err: ApiError = await res.clone().json();
    if (err.error?.code === "TOKEN_EXPIRED") {
      const newToken = await tryRefresh();
      if (newToken) {
        res = await fetchFn(newToken);
      }
    }
  }

  if (!res.ok) throw await res.json();
  const json: ApiResponse<T> = await res.json();
  return json.data;
}

export function apiGet<T>(path: string, token?: string): Promise<T> {
  return request<T>(
    (t) => fetch(`${API_URL}${path}`, {
      headers: t ? { Authorization: `Bearer ${t}` } : {},
    }),
    token,
  );
}

export function apiPost<T>(path: string, body: unknown, token?: string): Promise<T> {
  return request<T>(
    (t) => fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(t ? { Authorization: `Bearer ${t}` } : {}),
      },
      body: JSON.stringify(body),
    }),
    token,
  );
}

export function apiPatch<T>(path: string, body: unknown, token?: string): Promise<T> {
  return request<T>(
    (t) => fetch(`${API_URL}${path}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(t ? { Authorization: `Bearer ${t}` } : {}),
      },
      body: JSON.stringify(body),
    }),
    token,
  );
}

export function apiPut<T>(path: string, body: unknown, token?: string): Promise<T> {
  return request<T>(
    (t) => fetch(`${API_URL}${path}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(t ? { Authorization: `Bearer ${t}` } : {}),
      },
      body: JSON.stringify(body),
    }),
    token,
  );
}

export async function apiDelete(path: string, token?: string): Promise<void> {
  await request<null>(
    (t) => fetch(`${API_URL}${path}`, {
      method: "DELETE",
      headers: t ? { Authorization: `Bearer ${t}` } : {},
    }),
    token,
  );
}
