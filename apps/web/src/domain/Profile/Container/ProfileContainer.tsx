'use client';

import { useRouter } from 'next/navigation';
import { useMe } from '@/hooks/useUsers';
import { useMyInvitations } from '@/hooks/useInvitations';
import { MyPage } from '@/screens/MyPage';
import { ROUTES } from '@/constants/routes';
import { getInvitationCoverImageUrl } from '@/domain/InvitationList/invitationListUtils';
import { formatInvitationEventDate } from '@/utils/formatInvitationEventDate';

export default function ProfileContainer() {
  const router = useRouter();
  const { data: me, isLoading, isError, error } = useMe();
  const { data: invitations } = useMyInvitations();

  const recentInvitations = (invitations ?? []).slice(0, 10).map((inv) => ({
    id: inv.id,
    title: inv.title,
    date: formatInvitationEventDate(inv.eventStartAt),
    imageUrl: getInvitationCoverImageUrl(inv) || undefined,
    variant: inv.myRole === 'HOST' ? ('createdByMe' as const) : undefined,
  }));

  if (isLoading) return <MyPage state="loading" />;

  // 인증 에러 → 로그아웃 상태
  if (isError) {
    const code = (error as { error?: { code?: string } })?.error?.code;
    if (code === 'TOKEN_INVALID' || code === 'AUTH_USER_NOT_FOUND') {
      return <MyPage state="loggedOut" />;
    }
    return <MyPage state="error" />;
  }

  if (!me) return <MyPage state="loggedOut" />;

  return (
    <MyPage
      user={{
        id: me.id,
        name: me.name ?? undefined,
        nickname: me.nickname ?? '이름 없음',
        avatarUrl: me.profileImageUrl ?? undefined,
      }}
      recentInvitations={recentInvitations}
      participatedCount={invitations?.length ?? 0}
      onInvitationClick={(id) => router.push(ROUTES.INVITATIONS.DETAIL(id))}
      onProfileEdit={() => router.push(ROUTES.PROFILE.EDIT)}
      onSettings={() => router.push(ROUTES.PROFILE.SETTINGS)}
      onInquiries={() => router.push(ROUTES.INQUIRIES.HOME)}
      onAccount={() => router.push(ROUTES.PROFILE.ACCOUNT)}
      onSupport={() => router.push(ROUTES.INQUIRIES.HOME)}
      onHiddenFriends={() => router.push(ROUTES.FRIENDS.HIDDEN)}
    />
  );
}
