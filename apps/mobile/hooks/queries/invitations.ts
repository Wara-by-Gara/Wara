import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  cloneInvitation,
  createInvitation,
  deleteInvitation,
  fetchInvitation,
  fetchMyInvitations,
  invitationKeys,
  updateInvitation,
  updateInvitationStatus,
  type CreateInvitationPayload,
  type UpdateInvitationPayload,
} from '@/api';

export function useMyInvitations() {
  return useQuery({
    queryKey: invitationKeys.myList,
    queryFn: ({ signal }) => fetchMyInvitations({ signal }),
  });
}

export function useInvitation(id: string) {
  return useQuery({
    queryKey: invitationKeys.detail(id),
    queryFn: ({ signal }) => fetchInvitation(id, { signal }),
    enabled: !!id,
  });
}

export function useCreateInvitation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateInvitationPayload) => createInvitation(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: invitationKeys.myList }),
  });
}

export function useUpdateInvitation(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateInvitationPayload) => updateInvitation(id, payload),
    onSuccess: (updated) => {
      qc.setQueryData(invitationKeys.detail(id), updated);
      qc.invalidateQueries({ queryKey: invitationKeys.myList });
    },
  });
}

export function useUpdateInvitationStatus(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (status: 'active' | 'closed') => updateInvitationStatus(id, status),
    onSuccess: (updated) => {
      qc.setQueryData(invitationKeys.detail(id), updated);
      qc.invalidateQueries({ queryKey: invitationKeys.myList });
    },
  });
}

export function useDeleteInvitation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteInvitation(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: invitationKeys.all }),
  });
}

export function useCloneInvitation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cloneInvitation(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: invitationKeys.myList }),
  });
}
