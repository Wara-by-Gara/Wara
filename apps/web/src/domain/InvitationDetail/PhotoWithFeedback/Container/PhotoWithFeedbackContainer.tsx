'use client';

import { useState } from 'react';
import { usePhotos } from '@/hooks/usePhotos';
import { useInvitation } from '@/hooks/useInvitations';
import { useBest9 } from '@/hooks/useBest9';
import { InvitationDetailProps } from '../../types';
import Album from '../Album/Album';
import InvitationFeedbacks from '../InvitationFeedbacks/InvitationFeedbacks';
import BestNineModal from '../../BestNine/BestNineModal';

function isMomentLogVisible(eventStartAt: string | null): boolean {
  if (!eventStartAt) return false;
  return (
    Date.now() >= new Date(eventStartAt).getTime() + 7 * 24 * 60 * 60 * 1000
  );
}

export default function PhotoWithFeedbackContainer({
  invitationId,
  currentUserId,
  currentUserDisplayName,
  currentUserProfileImageUrl,
}: InvitationDetailProps) {
  const { data, isLoading, hasNextPage } =
    usePhotos(invitationId);
  const total = data?.pages[0]?.total ?? 0;
  const photos = data?.pages.flatMap((p) => p.rows) ?? [];

  const { data: invitation } = useInvitation(invitationId);
  const showMomentLog = isMomentLogVisible(invitation?.eventStartAt ?? null);
  const { data: best9 } = useBest9(showMomentLog ? invitationId : '');

  const [showMomentLogModal, setShowMomentLogModal] = useState(false);

  if (isLoading) return <div>로딩중 ....</div>;

  return (
    <>
      {showMomentLog && best9 && best9.length > 0 && (
        <button
          type="button"
          onClick={() => setShowMomentLogModal(true)}
          className="mb-3 w-full flex items-center justify-between rounded-3xl bg-linear-to-r from-primary to-purple-500 px-5 py-4 text-white"
        >
          <div className="text-left">
            <p className="text-[13px] font-semibold opacity-80">
              모임의 추억을 모아봤어요
            </p>
            <p className="mt-0.5 text-[16px] font-bold">리마인드 앨범 보기</p>
          </div>
          <span className="text-2xl">›</span>
        </button>
      )}
      <Album
        invitationId={invitationId}
        photos={photos}
        total={total}
        hasNextPage={!!hasNextPage}
      />
      <InvitationFeedbacks invitationId={invitationId} />
      {showMomentLogModal && (
        <BestNineModal
          invitationId={invitationId}
          onClose={() => setShowMomentLogModal(false)}
        />
      )}
    </>
  );
}
