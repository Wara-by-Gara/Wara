import { apiPost } from "./client";

export function refreshTokens(refreshToken: string) {
  return apiPost<{ accessToken: string; refreshToken: string }>("/auth/refresh", { refreshToken });
}

export function logout(refreshToken: string) {
  return apiPost<void>("/auth/logout", { refreshToken });
}
