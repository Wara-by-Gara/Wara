const BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001') + '/api';

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    public readonly type: string,
    message: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiClient<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const { headers, ...rest } = options;

  const res = await fetch(`${BASE_URL}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(headers as Record<string, string>),
    },
    ...rest,
  });

  if (res.status === 204) return undefined as T;

  const json = await res.json();

  if (!json.success) {
    throw new ApiError(
      json.error.code,
      json.error.type,
      json.error.message,
      json.error.details,
    );
  }

  return json.data as T;
}
