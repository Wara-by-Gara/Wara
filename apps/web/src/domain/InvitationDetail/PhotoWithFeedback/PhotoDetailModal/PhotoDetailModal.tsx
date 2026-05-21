'use client';

import { useState, useEffect } from 'react';
import { Photo, getPhoto } from '@/lib/api/photos';
import { PhotoViewer } from '@/components/organisms/PhotoViewer';
import { usePhotoFeedback } from '@/hooks/usePhotoFeedbacks';

interface Props {
  photos: Photo[];
  initialIndex: number;
  onClose: () => void;
}

export default function PhotoDetailModal({
  photos,
  initialIndex,
  onClose,
}: Props) {
  const [index, setIndex] = useState(initialIndex);
  const [token, setToken] = useState('');
  const [commentsOpen, setCommentsOpen] = useState(false);
  const photo = photos[index];

  useEffect(() => {
    setToken(localStorage.getItem('access_token') ?? '');
  }, []);

  useEffect(() => {
    if (!photo) return;
    getPhoto(photo.invitationId, photo.id, token);
  }, [photo?.id, photo?.invitationId, token]);

  const { data: feedbackData, submitComment } = usePhotoFeedback(
    photo?.invitationId ?? '',
    photo?.id ?? '',
    token,
  );

  if (!photo) return null;

  const comments = (feedbackData?.rows ?? []).map((f) => ({
    id: f.id,
    authorName: f.participant.id,
    content: f.content,
    createdAt: new Date(f.createdAt).toLocaleDateString('ko-KR'),
  }));

  return (
    <PhotoViewer
      open={true}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      onClose={onClose}
      src={photo.url}
      likeCount={photo.likeCount}
      commentCount={feedbackData?.rows.length ?? 0}
      createdAt={new Date(photo.createdAt).toLocaleDateString('ko-KR')}
      commentsOpen={commentsOpen}
      onCommentsOpenChange={setCommentsOpen}
      comments={comments}
      onCommentSubmit={submitComment}
      className="[&_.bg-gray-100]:bg-white/20"
      rightActions={
        <div className="flex items-center gap-1">
          {index > 0 && (
            <button
              onClick={() => setIndex((i) => i - 1)}
              className="text-white text-4xl px-2"
            >
              ‹
            </button>
          )}
          {index < photos.length - 1 && (
            <button
              onClick={() => setIndex((i) => i + 1)}
              className="text-white text-4xl px-2"
            >
              ›
            </button>
          )}
        </div>
      }
    />
  );
}
