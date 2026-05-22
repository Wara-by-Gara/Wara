import { apiGet } from "./client";

export interface Me {
  id: string;
  email: string | null;
  name: string | null;
  nickname: string | null;
  profileImageUrl: string | null;
}

export function getMe(token: string): Promise<Me> {
  return apiGet<Me>("/users/me", token);
}
