import { apiDelete, apiGet, apiPatch } from "./client";

export interface Me {
  id: string;
  email: string | null;
  name: string | null;
  nickname: string | null;
  profileImageUrl: string | null;
}

export function getMe(): Promise<Me> {
  return apiGet<Me>("/users/me");
}

export function updateMe(payload: { nickname: string }, token: string): Promise<Me> {
  return apiPatch<Me>("/users/me", payload, token);
}

export function deleteMe(token: string): Promise<void> {
  return apiDelete("/users/me", token);
}
