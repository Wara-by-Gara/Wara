"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createTextBlast,
  deleteTextBlast,
  getTextBlasts,
} from "@/lib/api/textBlasts";

const textBlastKey = (invitationId: string) =>
  ["invitations", invitationId, "text-blasts"] as const;

export function useTextBlasts(
  invitationId: string,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: textBlastKey(invitationId),
    queryFn: () => getTextBlasts(invitationId),
    enabled: options?.enabled,
  });
}

export function useCreateTextBlast(invitationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (message: string) =>
      createTextBlast(invitationId, message, crypto.randomUUID()),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: textBlastKey(invitationId) }),
  });
}

export function useDeleteTextBlast(invitationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTextBlast(invitationId, id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: textBlastKey(invitationId) }),
  });
}
