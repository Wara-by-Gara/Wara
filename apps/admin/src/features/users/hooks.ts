import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from './api';

type UsersParams = {
  query?: string;
  status?: string;
  limit?: number;
  offset?: number;
};

const userKeys = {
  list: (params: UsersParams) => ['admin-users', 'list', params] as const,
  detail: (id: string) => ['admin-users', id] as const,
};

export function useUsers(params: UsersParams) {
  return useQuery({
    queryKey: userKeys.list(params),
    queryFn: () => api.fetchUsers(params),
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: () => api.fetchUser(id),
    enabled: !!id,
  });
}

export function useSuspendUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      api.suspendUser(id, reason),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: userKeys.detail(id) });
      qc.invalidateQueries({ queryKey: ['admin-users', 'list'] });
    },
  });
}

export function useUnsuspendUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string }) => api.unsuspendUser(id),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: userKeys.detail(id) });
      qc.invalidateQueries({ queryKey: ['admin-users', 'list'] });
    },
  });
}

export function useUpdateUserRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: 'admin' | 'member' }) =>
      api.updateUserRole(id, role),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: userKeys.detail(id) });
      qc.invalidateQueries({ queryKey: ['admin-users', 'list'] });
    },
  });
}
