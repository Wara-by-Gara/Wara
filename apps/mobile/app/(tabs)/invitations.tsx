import { useQueryClient } from '@tanstack/react-query';

import { InvitationsList } from '@/components/invitations-list';

// 토큰 게이팅은 (tabs)/_layout.tsx의 useAuthGuard가 처리.
// InvitationsList는 Phase 1에서 네이티브 grouped 리스트로 재작성 예정.
const AUTH_KEY = ['auth', 'access-token'] as const;

export default function InvitationsTabScreen() {
  const queryClient = useQueryClient();
  return <InvitationsList onLogout={() => queryClient.invalidateQueries({ queryKey: AUTH_KEY })} />;
}
