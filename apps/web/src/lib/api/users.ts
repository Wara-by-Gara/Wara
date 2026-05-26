import { apiGet, apiPatch } from "./client";

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
