'use client';

import { useState, useEffect } from 'react';
import { Photo, getPhoto, togglePhotoLike, getDownloadUrls } from '@/lib/api/photos';
import { PhotoViewer } from '@/components/organisms/PhotoViewer';
import { usePhotoFeedback } from '@/hooks/usePhotoFeedbacks';
import { useMe } from '@/hooks/useUsers';
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
  const [editingComment, setEditingComment] = useState<{ id: string; content: string } | undefined>();
  const photo = photos[index];
  const { data: me } = useMe();

  useEffect(() => {
    if (!photo) return;
    getPhoto(photo.invitationId, photo.id).then((result) => {
      if (result.liked !== undefined) {
        onLikeChange(photo.id, result.liked, result.likeCount);
      }
    });
  }, [photo?.id]);

  const { data: feedbackData, submitComment, updateComment, deleteComment } = usePhotoFeedback(
    photo?.invitationId ?? '',
    photo?.id ?? '',
  );

  if (!photo) return null;

  const currentLikeCount = likeCountMap.get(photo.id) ?? photo.likeCount;
  const currentLiked = likedMap.get(photo.id) ?? false;

  const handleSave = async () => {
    const items = await getDownloadUrls(photo.invitationId, [photo.id]);
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

  const handleLike = async () => {
    const result = await togglePhotoLike(photo.invitationId, photo.id);
    const newCount = result.liked ? currentLikeCount + 1 : currentLikeCount - 1;
    onLikeChange(photo.id, result.liked, newCount);
  };

  const buildMenuItems = (id: string, content: string) => [
    {
      label: '수정',
      onClick: () => {
        setCommentsOpen(true);
        setEditingComment({ id, content });
      },
      className: 'text-gray-900',
    },
    {
      label: '삭제',
      onClick: () => deleteComment(id),
      className: 'text-danger',
    },
  ];

  const handleCommentSubmit = async (text: string) => {
    if (editingComment) {
      await updateComment(editingComment.id, text);
      setEditingComment(undefined);
    } else {
      await submitComment(text);
    }
  };

  const comments = (feedbackData?.rows ?? []).flatMap((f) => {
    const isMine = !!me && f.participant.userId === me.id;
    return [
      {
        id: f.id,
        authorName: f.participant.user.nickname,
        content: f.content,
        createdAt: timeAgo(f.createdAt),
        variant: isMine ? ('mine' as const) : ('default' as const),
        moreMenuItems: isMine ? buildMenuItems(f.id, f.content) : undefined,
      },
      ...f.replies.map((r) => {
        const isReplyMine = !!me && r.participant.userId === me.id;
        return {
          id: r.id,
          authorName: r.participant.user.nickname,
          content: `↳ ${r.content}`,
          createdAt: timeAgo(r.createdAt),
          variant: isReplyMine ? ('mine' as const) : ('default' as const),
          moreMenuItems: isReplyMine ? buildMenuItems(r.id, r.content) : undefined,
        };
      }),
    ];
  });

  return (
    <PhotoViewer
      open={true}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      onClose={onClose}
      onSave={handleSave}
      src={photo.url}
      likeCount={currentLikeCount}
      commentCount={feedbackData?.rows.length ?? 0}
      createdAt={timeAgo(photo.createdAt)}
      commentsOpen={commentsOpen}
      onCommentsOpenChange={setCommentsOpen}
      comments={comments}
      onCommentSubmit={handleCommentSubmit}
      editingComment={editingComment}
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
