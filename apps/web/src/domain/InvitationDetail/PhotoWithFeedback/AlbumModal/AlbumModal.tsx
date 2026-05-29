'use client';

import { useEffect, useState } from 'react';
import { Photo, getDownloadUrls, getAllDownloadUrls, PhotoDownloadItem, togglePhotoLike } from '@/lib/api/photos';
import { PhotoListModal } from '@/components/organisms/PhotoListModal';
import PhotoDetailModal from '@/domain/InvitationDetail/PhotoWithFeedback/PhotoDetailModal/PhotoDetailModal';

interface Props {
  photos: Photo[];
  onClose: () => void;
  fetchNextPage: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  initialLikedMap?: Map<string, boolean>;
  initialLikeCountMap?: Map<string, number>;
  onLikeChange?: (photoId: string, liked: boolean, likeCount: number) => void;
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

export default function AlbumModal({ photos, onClose, fetchNextPage, hasNextPage, isFetchingNextPage, initialLikedMap, initialLikeCountMap, onLikeChange }: Props) {
  const invitationId = photos[0]?.invitationId;

  const [viewingIndex, setViewingIndex] = useState<number | null>(null);
  const [likedMap, setLikedMap] = useState(() => {
    const base = new Map(photos.map((p) => [p.id, p.liked ?? false]));
    initialLikedMap?.forEach((v, k) => base.set(k, v));
    return base;
  });
  const [likeCountMap, setLikeCountMap] = useState(() => {
    const base = new Map(photos.map((p) => [p.id, p.likeCount]));
    initialLikeCountMap?.forEach((v, k) => base.set(k, v));
    return base;
  });

  const handleLikeChange = (photoId: string, liked: boolean, likeCount: number) => {
    setLikedMap((prev) => new Map(prev).set(photoId, liked));
    setLikeCountMap((prev) => new Map(prev).set(photoId, likeCount));
    onLikeChange?.(photoId, liked, likeCount);
  };

  const handlePhotoLike = async (photoId: string) => {
    if (!invitationId) return;
    const currentLiked = likedMap.get(photoId) ?? false;
    const currentCount = likeCountMap.get(photoId) ?? 0;
    const newLiked = !currentLiked;
    setLikedMap((prev) => new Map(prev).set(photoId, newLiked));
    setLikeCountMap((prev) => new Map(prev).set(photoId, newLiked ? currentCount + 1 : currentCount - 1));
    onLikeChange?.(photoId, newLiked, newLiked ? currentCount + 1 : currentCount - 1);
    try {
      const result = await togglePhotoLike(invitationId, photoId);
      setLikedMap((prev) => new Map(prev).set(photoId, result.liked));
      setLikeCountMap((prev) => new Map(prev).set(photoId, result.likeCount));
      onLikeChange?.(photoId, result.liked, result.likeCount);
    } catch {
      setLikedMap((prev) => new Map(prev).set(photoId, currentLiked));
      setLikeCountMap((prev) => new Map(prev).set(photoId, currentCount));
      onLikeChange?.(photoId, currentLiked, currentCount);
    }
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
        onPhotoLike={handlePhotoLike}
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
