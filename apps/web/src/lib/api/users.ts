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

export function updateMe(payload: { nickname: string }): Promise<Me> {
  return apiPatch<Me>("/users/me", payload);
}

export function deleteMe(): Promise<void> {
  return apiDelete("/users/me");
}

export interface MySocial {
  id: string;
  provider: string;
  createdAt: string;
  updatedAt: string;
}

export function getMySocials(): Promise<MySocial[]> {
  return apiGet<MySocial[]>("/users/me/socials");
}

export function deleteMySocial(provider: string): Promise<void> {
  return apiDelete(`/users/me/socials/${provider}`);
}
