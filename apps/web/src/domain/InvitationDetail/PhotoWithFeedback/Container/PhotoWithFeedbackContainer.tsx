'use client';

import { usePhotos } from '@/hooks/usePhotos';
import { useMe } from '@/hooks/useUsers';
import { InvitationDetailProps } from '../../types';
import Album from '../Album/Album';
import InvitationFeedbacks from '../InvitationFeedbacks/InvitationFeedbacks';

export default function PhotoWithFeedbackContainer({
  invitationId,
}: InvitationDetailProps) {
  const { data: me } = useMe();
  const currentUserId = me?.id ?? null;

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    usePhotos(invitationId);
  const total = data?.pages[0]?.total ?? 0;
  const photos = data?.pages.flatMap((p) => p.rows) ?? [];

  if (isLoading) return <div>로딩중 ....</div>;

  return (
    <>
      <Album
        invitationId={invitationId}
        photos={photos}
        total={total}
        fetchNextPage={fetchNextPage}
        hasNextPage={!!hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
      />
      <InvitationFeedbacks
        invitationId={invitationId}
        currentUserId={currentUserId}
      />
    </>
  );
}
