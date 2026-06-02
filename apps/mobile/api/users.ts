import { apiFetch } from './client';

export interface Me {
  id: string;
  name: string | null;
  email: string | null;
  birthYear: number | null;
  nickname: string | null;
  profileImageUrl: string | null;
}

export interface UpdateMeInput {
  name?: string;
  email?: string;
  birthYear?: number;
}

export const userKeys = {
  all: ['users'] as const,
  me: () => [...userKeys.all, 'me'] as const,
};

export function fetchMe(signal?: AbortSignal): Promise<Me> {
  return apiFetch<Me>('/users/me', { signal });
}

export function updateMe(body: UpdateMeInput): Promise<Me> {
  return apiFetch<Me>('/users/me', { method: 'PATCH', body });
}
