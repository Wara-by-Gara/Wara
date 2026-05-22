'use client';

import { useState, useEffect } from 'react';
import { usePhotos } from '@/hooks/usePhotos';
import { InvitationDetailProps } from '../../types';
import Album from '../Album/Album';
import InvitationFeedbacks from '../InvitationFeedbacks/InvitationFeedbacks';

export default function PhotoWithFeedbackContainer({
  invitationId,
}: InvitationDetailProps) {
  const [token, setToken] = useState('');
  const getUserIdFromToken = (token: string): string | null => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]!));
      return payload.id;
    } catch {
      return null;
    }
  };
  const currentUserId = token ? getUserIdFromToken(token) : null;

  useEffect(() => {
    setToken(localStorage.getItem('access_token') ?? '');
  }, []);

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    usePhotos(invitationId, token);
  const total = data?.pages[0]?.total ?? 0;
  const photos = data?.pages.flatMap((p) => p.rows) ?? [];

  if (isLoading && token) return <div>로딩중 ....</div>;

  return (
    <>
      <Album
        photos={photos}
        total={total}
        fetchNextPage={fetchNextPage}
        hasNextPage={!!hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
      />
      <InvitationFeedbacks
        invitationId={invitationId}
        token={token}
        currentUserId={currentUserId}
      />
    </>
  );
}
