'use client';

import { useQuery } from '@tanstack/react-query';
import { getBest9 } from '@/lib/api/photos';
import { QUERY_KEYS } from '@/constants/queryKeys';

export function useBest9(invitationId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.invitations.photoBest9(invitationId),
    queryFn: () => getBest9(invitationId),
    enabled: !!invitationId,
  });
}
