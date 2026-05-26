'use client';

import { Photo, togglePhotoLike, getDownloadUrls, getAllDownloadUrls, PhotoDownloadItem } from '@/lib/api/photos';
import { createPhotoFeedback } from '@/lib/api/feedbacks';
import { PhotoListModal } from '@/components/organisms/PhotoListModal';

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

export default function AlbumModal({ photos, onClose }: Props) {
  const invitationId = photos[0]?.invitationId;

  const modalPhotos = photos.map((p) => ({
    id: p.id,
    src: p.url,
    alt: '',
    likeCount: p.likeCount,
    liked: p.liked ?? false,
    createdAt: p.createdAt,
  }));

  const handlePhotoLike = async (photoId: string) => {
    if (!invitationId) return;
    await togglePhotoLike(invitationId, photoId);
  };

  const handleCommentSubmit = async (photoId: string, text: string) => {
    if (!invitationId) return;
    await createPhotoFeedback(invitationId, photoId, text);
  };

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
    <PhotoListModal
      open
      onOpenChange={(o) => { if (!o) onClose(); }}
      photos={modalPhotos}
      onPhotoLike={handlePhotoLike}
      onCommentSubmit={handleCommentSubmit}
      onSelectDownload={handleSelectDownload}
      onDownloadAll={handleDownloadAll}
    />
  );
}
