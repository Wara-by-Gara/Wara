import { useQueryClient } from '@tanstack/react-query';

import { InvitationsList } from '@/components/invitations-list';

// 초대장 목록 — 루트 스택 /invitations (탭에서 분리, 네이티브 헤더 '초대장').
// InvitationsList는 Phase 1에서 네이티브 grouped 리스트로 재작성 예정.
const AUTH_KEY = ['auth', 'access-token'] as const;

export default function InvitationsScreen() {
  const queryClient = useQueryClient();
  return <InvitationsList onLogout={() => queryClient.invalidateQueries({ queryKey: AUTH_KEY })} />;
}
