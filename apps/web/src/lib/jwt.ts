export function parseJWT(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3 || !parts[1]) return null;

    const decoded = JSON.parse(atob(parts[1]));
    return decoded;
  } catch {
    return null;
  }
}

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;

  return (
    document.cookie
      .split('; ')
      .find((row) => row.startsWith('accessToken='))
      ?.slice('accessToken='.length) ?? null
  );
}

export function getUserRole(): string | null {
  const token = getAccessToken();
  if (!token) return null;

  const decoded = parseJWT(token);
  return decoded?.role as string | null;
}
