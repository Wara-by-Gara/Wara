'use client';

import { useState } from 'react';
import { Icon } from '@/components/icons';
import { Avatar } from '@/components/primitives/Avatar';
import { TopAppBar } from '@/components/molecules/TopAppBar';
import { PhotoGrid } from '@/components/organisms/PhotoGrid';
import { PhotoGridItem } from '@/components/organisms/PhotoGridItem';
import { AlbumGridSkeleton } from '@/components/organisms/Skeleton';
import { cn } from '@/lib/cn';
import { mobileMainCenter, mobileMainScroll } from '@/lib/mobilePageLayout';
import { useBest9 } from '@/hooks/useBest9';
import { useInvitation } from '@/hooks/useInvitations';
import PhotoDetailModal from '../PhotoWithFeedback/PhotoDetailModal/PhotoDetailModal';

interface Props {
  invitationId: string;
  onClose: () => void;
}

export default function BestNineModal({ invitationId, onClose }: Props) {
  const { data: invitation } = useInvitation(invitationId);
  const { data: photos, isLoading, isError } = useBest9(invitationId);

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [likedMap, setLikedMap] = useState<Map<string, boolean>>(new Map());
  const [likeCountMap, setLikeCountMap] = useState<Map<string, number>>(new Map());

  const handleLikeChange = (photoId: string, liked: boolean, likeCount: number) => {
    setLikedMap((prev) => new Map(prev).set(photoId, liked));
    setLikeCountMap((prev) => new Map(prev).set(photoId, likeCount));
  };

  const eventDate = invitation?.eventStartAt
    ? new Date(invitation.eventStartAt).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';

  const hasPhotos = !isLoading && !isError && !!photos && photos.length > 0;

  return (
    <div className="fixed inset-0 z-50 mx-auto flex w-full max-w-md flex-col bg-background">
      <TopAppBar className="shrink-0" title="리마인드 앨범" onBack={onClose} />

      {hasPhotos && (
        <div className="shrink-0 border-b border-border bg-surface px-page py-4">
          <div className="flex items-center gap-3">
            <Avatar
              src={invitation?.host?.profileImageUrl ?? undefined}
              alt={invitation?.host?.nickname ?? ''}
              size="md"
              name={invitation?.host?.name ?? invitation?.host?.nickname ?? undefined}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-bold text-text-primary">
                {invitation?.title ?? ''}
              </p>
              <p className="mt-0.5 text-[13px] text-text-secondary">{eventDate}</p>
            </div>
            <div className="flex items-center gap-1 rounded-full bg-primary-soft px-3 py-1.5">
              <Icon name="retro-camera" size="sm" color="primary" decorative />
              <span className="text-[13px] font-semibold text-primary">
                {photos!.length}장
              </span>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-yellow-50 px-3 py-1 text-[12px] font-medium text-yellow-600">
              <Icon name="heart" size="xs" color="currentColor" decorative />
              베스트 {photos!.length}장
            </span>
          </div>
        </div>
      )}

      <main className={cn(hasPhotos ? mobileMainScroll : mobileMainCenter, hasPhotos && 'px-3 py-3')}>
        {isLoading ? (
          <AlbumGridSkeleton />
        ) : !hasPhotos ? (
          <p className="text-center text-[14px] text-text-secondary">아직 추억이 없어요</p>
        ) : (
          <PhotoGrid columns={3}>
            {photos!.map((photo, idx) => (
              <PhotoGridItem
                key={photo.id}
                src={photo.url}
                alt=""
                onClick={() => setSelectedIndex(idx)}
              />
            ))}
          </PhotoGrid>
        )}
      </main>

      {selectedIndex !== null && photos && (
        <PhotoDetailModal
          photos={photos}
          initialIndex={selectedIndex}
          onClose={() => setSelectedIndex(null)}
          likedMap={likedMap}
          likeCountMap={likeCountMap}
          onLikeChange={handleLikeChange}
        />
      )}
    </div>
  );
}
