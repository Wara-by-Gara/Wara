import { useQueryClient } from '@tanstack/react-query';

import { InvitationsList } from '@/components/invitations-list';

// 토큰 게이팅은 상위 (tabs)/_layout.tsx의 useAuthGuard가 처리.
// 여기 도달했다는 건 토큰이 있다는 뜻 → 곧장 목록 렌더.
const AUTH_KEY = ['auth', 'access-token'] as const;

export default function HomeScreen() {
  const queryClient = useQueryClient();
  return (
    <InvitationsList
      onLogout={() => queryClient.invalidateQueries({ queryKey: AUTH_KEY })}
    />
  );
}
