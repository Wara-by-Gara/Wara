'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { deletePhoto } from '@/lib/api/photos';

export function useDeletePhoto(invitationId: string, onSuccess?: () => void) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (photoId: string) => deletePhoto(invitationId, photoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.invitations.photos(invitationId) });
      onSuccess?.();
    },
  });
}
