// 단체 공지 TanStack Query 훅 — 시트가 열렸을 때만 조회하도록 enabled 옵션 지원.

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { createTextBlast, fetchTextBlasts, textBlastKeys } from '@/api/textBlast';

export function useTextBlasts(invitationId: string, opts: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: textBlastKeys.list(invitationId),
    queryFn: ({ signal }) => fetchTextBlasts(invitationId, { signal }),
    enabled: (opts.enabled ?? true) && !!invitationId,
  });
}

export function useCreateTextBlast(invitationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (message: string) => createTextBlast(invitationId, message),
    onSuccess: () => qc.invalidateQueries({ queryKey: textBlastKeys.list(invitationId) }),
  });
}
