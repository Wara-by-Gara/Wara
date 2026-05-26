'use client';

import { useState, useEffect } from 'react';
import { Photo, getPhoto, togglePhotoLike } from '@/lib/api/photos';
import { PhotoViewer } from '@/components/organisms/PhotoViewer';
import { usePhotoFeedback } from '@/hooks/usePhotoFeedbacks';
import { timeAgo } from '@/utils/timeAge';

interface Props {
  photos: Photo[];
  initialIndex: number;
  onClose: () => void;
  likedMap: Map<string, boolean>;
  likeCountMap: Map<string, number>;
  onLikeChange: (photoId: string, liked: boolean, likeCount: number) => void;
}

export default function PhotoDetailModal({
  photos,
  initialIndex,
  onClose,
  likedMap,
  likeCountMap,
  onLikeChange,
}: Props) {
  const [index, setIndex] = useState(initialIndex);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const photo = photos[index];

  useEffect(() => {
    if (!photo) return;
    getPhoto(photo.invitationId, photo.id).then((result) => {
      if (result.liked !== undefined) {
        onLikeChange(photo.id, result.liked, result.likeCount);
      }
    });
  }, [photo?.id]);

  const { data: feedbackData, submitComment } = usePhotoFeedback(
    photo?.invitationId ?? '',
    photo?.id ?? '',
  );

  if (!photo) return null;

  const currentLikeCount = likeCountMap.get(photo.id) ?? photo.likeCount;
  const currentLiked = likedMap.get(photo.id) ?? false;

  const handleLike = async () => {
    const result = await togglePhotoLike(photo.invitationId, photo.id);
    const newCount = result.liked ? currentLikeCount + 1 : currentLikeCount - 1;
    onLikeChange(photo.id, result.liked, newCount);
  };

  const comments = (feedbackData?.rows ?? []).flatMap((f) => [
    {
      id: f.id,
      authorName: f.participant.id,
      content: f.content,
      createdAt: timeAgo(f.createdAt),
    },
    ...f.replies.map((r) => ({
      id: r.id,
      authorName: r.participant.id,
      content: `↳ ${r.content}`,
      createdAt: timeAgo(r.createdAt),
    })),
  ]);

  return (
    <PhotoViewer
      open={true}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      onClose={onClose}
      src={photo.url}
      likeCount={currentLikeCount}
      commentCount={feedbackData?.rows.length ?? 0}
      createdAt={timeAgo(photo.createdAt)}
      commentsOpen={commentsOpen}
      onCommentsOpenChange={setCommentsOpen}
      comments={comments}
      onCommentSubmit={submitComment}
      liked={currentLiked}
      onLike={handleLike}
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
