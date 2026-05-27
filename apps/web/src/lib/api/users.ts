import { apiDelete, apiGet, apiPatch } from "./client";

export interface Me {
  id: string;
  email: string | null;
  name: string | null;
  nickname: string | null;
  birthYear: number | null;
  profileImageUrl: string | null;
}

export interface UpdateMeInput {
  name?: string;
  email?: string;
  birthYear?: number;
  nickname?: string;
  gender?: "male" | "female";
  profileImageUrl?: string;
}

export function getMe(): Promise<Me> {
  return apiGet<Me>("/users/me");
}

export function updateMe(data: UpdateMeInput): Promise<Me> {
  return apiPatch<Me>("/users/me", data);
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
