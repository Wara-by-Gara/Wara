import { apiGet, apiPost, apiPatch } from '@/lib/api/client';
import type { UsersListResponse, AdminUserDetail } from './types';

export function fetchUsers(params: {
  query?: string;
  status?: string;
  limit?: number;
  offset?: number;
}) {
  const qs = new URLSearchParams();
  if (params.query) qs.set('query', params.query);
  if (params.status) qs.set('status', params.status);
  qs.set('limit', String(params.limit ?? 20));
  qs.set('offset', String(params.offset ?? 0));
  return apiGet<UsersListResponse>(`/admin/users?${qs}`);
}

export function fetchUser(id: string) {
  return apiGet<AdminUserDetail>(`/admin/users/${id}`);
}

export function suspendUser(id: string, reason?: string) {
  return apiPost<{ id: string; suspendedAt: string }>(`/admin/users/${id}/suspend`, { reason });
}

export function unsuspendUser(id: string) {
  return apiPost<{ id: string; suspendedAt: null }>(`/admin/users/${id}/unsuspend`, {});
}

export function updateUserRole(id: string, role: 'admin' | 'member') {
  return apiPatch<{ id: string; role: string }>(`/admin/users/${id}/role`, { role });
}
