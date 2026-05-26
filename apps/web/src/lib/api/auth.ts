import { apiPost } from "./client";

export function refreshTokens() {
  return apiPost<{ refreshExpiresIn: number }>("/auth/refresh");
}

export function logout() {
  return apiPost<void>("/auth/logout");
}
