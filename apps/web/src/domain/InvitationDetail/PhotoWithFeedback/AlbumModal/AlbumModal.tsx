'use client';

import { useEffect, useState } from 'react';
import { Photo, getDownloadUrls, getAllDownloadUrls, PhotoDownloadItem } from '@/lib/api/photos';
import { PhotoListModal } from '@/components/organisms/PhotoListModal';
import PhotoDetailModal from '@/domain/InvitationDetail/PhotoWithFeedback/PhotoDetailModal/PhotoDetailModal';

interface Props {
  photos: Photo[];
  onClose: () => void;
  fetchNextPage: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
}

const triggerDownloads = (items: PhotoDownloadItem[]) => {
  items.forEach(({ url }) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = '';
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  });
};

export default function AlbumModal({ photos, onClose, fetchNextPage, hasNextPage, isFetchingNextPage }: Props) {
  const invitationId = photos[0]?.invitationId;

  useEffect(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const [viewingIndex, setViewingIndex] = useState<number | null>(null);
  const [likedMap, setLikedMap] = useState(
    () => new Map(photos.map((p) => [p.id, p.liked ?? false]))
  );
  const [likeCountMap, setLikeCountMap] = useState(
    () => new Map(photos.map((p) => [p.id, p.likeCount]))
  );

  const handleLikeChange = (photoId: string, liked: boolean, likeCount: number) => {
    setLikedMap((prev) => new Map(prev).set(photoId, liked));
    setLikeCountMap((prev) => new Map(prev).set(photoId, likeCount));
  };

  const modalPhotos = photos.map((p) => ({
    id: p.id,
    src: p.url,
    alt: '',
    likeCount: likeCountMap.get(p.id) ?? p.likeCount,
    liked: likedMap.get(p.id) ?? false,
    createdAt: p.createdAt,
  }));

  const handleSelectDownload = async (photoIds: string[]) => {
    if (!invitationId || photoIds.length === 0) return;
    const items = await getDownloadUrls(invitationId, photoIds);
    triggerDownloads(items);
  };

  const handleDownloadAll = async () => {
    if (!invitationId) return;
    const items = await getAllDownloadUrls(invitationId);
    triggerDownloads(items);
  };

  return (
    <>
      <PhotoListModal
        open
        onOpenChange={(o) => { if (!o) onClose(); }}
        photos={modalPhotos}
        onPhotoClick={(idx) => setViewingIndex(idx)}
        onSelectDownload={handleSelectDownload}
        onDownloadAll={handleDownloadAll}
      />
      {viewingIndex !== null && (
        <PhotoDetailModal
          photos={photos}
          initialIndex={viewingIndex}
          onClose={() => setViewingIndex(null)}
          likedMap={likedMap}
          likeCountMap={likeCountMap}
          onLikeChange={handleLikeChange}
        />
      )}
    </>
  );
}
