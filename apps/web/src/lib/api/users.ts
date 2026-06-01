import { apiDelete, apiGet, apiPatch, apiPost } from "./client";

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
  profileImageUrl?: string | null;
}

type ProfileImageContentType = "image/jpeg" | "image/png" | "image/webp" | "image/heic" | "image/heif";

export function getProfileImagePresignedUrl(
  fileName: string,
  contentType: ProfileImageContentType,
): Promise<{ presignedUrl: string; key: string }> {
  return apiPost<{ presignedUrl: string; key: string }>("/users/me/presigned-url", { fileName, contentType });
}

export interface UserProfile {
  id: string;
  name: string | null;
  nickname: string | null;
  profileImageUrl: string | null;
}

export function getMe(): Promise<Me> {
  return apiGet<Me>("/users/me");
}

export function getUserProfile(userId: string): Promise<UserProfile> {
  return apiGet<UserProfile>(`/users/${userId}`);
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
