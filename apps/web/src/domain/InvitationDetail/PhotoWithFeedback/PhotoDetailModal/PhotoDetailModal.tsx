'use client';

import { useState, useEffect, type ReactNode, type ChangeEvent } from 'react';
import { Photo, getPhoto, togglePhotoLike, getDownloadUrls } from '@/lib/api/photos';
import { PhotoViewer } from '@/components/organisms/PhotoViewer';
import { GifPicker } from '@/components/organisms/GifPicker';
import { MentionListSkeleton } from '@/components/organisms/Skeleton';
import { usePhotoFeedback } from '@/hooks/usePhotoFeedbacks';
import { useMe } from '@/hooks/useUsers';
import { useMyParticipant, useParticipants } from '@/hooks/useParticipants';
import { useDeletePhoto } from '@/hooks/useDeletePhoto';
import { ConfirmModal } from '@/components/molecules/Modal';
import { timeAgo } from '@/utils/timeAge';
import { Avatar } from '@/components/primitives/Avatar';
import { getCommentAuthorName } from '@/domain/InvitationDetail/types';

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
  const [replyingTo, setReplyingTo] = useState<{ id: string; authorName: string } | null>(null);
  const [isLiking, setIsLiking] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [mentionedUserIds, setMentionedUserIds] = useState<string[]>([]);
  const [pendingGif, setPendingGif] = useState<string | null>(null);
  const [gifPickerOpen, setGifPickerOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const photo = photos[index];
  const { data: me } = useMe();
  const { data: myParticipant } = useMyParticipant(photo?.invitationId ?? '');
  const { data: participantsData, isLoading: isParticipantsLoading } = useParticipants(photo?.invitationId ?? '');
  const allParticipants = participantsData?.participants ?? [];
  const { mutate: deleteMutate, isPending: isDeleting } = useDeletePhoto(photo?.invitationId ?? '', onClose);
  const isOwner = !!myParticipant && !!photo && myParticipant.id === photo.participantId;

  useEffect(() => {
    if (!photo) return;
    getPhoto(photo.invitationId, photo.id).then((result) => {
      if (result.liked !== undefined) {
        onLikeChange(photo.id, result.liked, result.likeCount);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photo?.id]);

  const mentionQuery = (() => {
    const match = inputValue.match(/@(\S*)$/);
    return match ? match[1] : null;
  })();

  const filteredParticipants = mentionQuery !== null
    ? allParticipants.filter((p) =>
        getCommentAuthorName(p.user).toLowerCase().includes((mentionQuery ?? '').toLowerCase())
      )
    : [];

  const showAllOption = mentionQuery != null && 'all'.includes(mentionQuery.toLowerCase());

  const handleSelectMention = (userId: string, nickname: string) => {
    if (userId === '__all__') {
      const allUserIds = allParticipants
        .map((p) => p.user.id)
        .filter((id) => id !== me?.id);
      setMentionedUserIds([...new Set(allUserIds)]);
      setInputValue(inputValue.replace(/@\S*$/, '@all '));
    } else {
      const newValue = inputValue.replace(/@\S*$/, `@${nickname} `);
      setInputValue(newValue);
      setMentionedUserIds((prev) => [...new Set([...prev, userId])]);
    }
  };

  const { data: feedbackData, submitComment, updateComment, deleteComment, toggleLike, getLiked, getLikeCount } = usePhotoFeedback(
    photo?.invitationId ?? '',
    photo?.id ?? '',
  );

  if (!photo) return null;

  const currentLikeCount = likeCountMap.get(photo.id) ?? photo.likeCount;
  const currentLiked = likedMap.get(photo.id) ?? photo.liked ?? false;

  const handleSave = async () => {
    const items = await getDownloadUrls(photo.invitationId, [photo.id]);
    items.forEach(({ url }) => {
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = url;
      document.body.appendChild(iframe);
      setTimeout(() => {
        if (document.body.contains(iframe)) document.body.removeChild(iframe);
      }, 60_000);
    });
  };

  const handleLike = async () => {
    if (isLiking) return;

    const prevLiked = currentLiked;
    const prevCount = currentLikeCount;
    const optimisticLiked = !prevLiked;
    const optimisticCount = optimisticLiked ? prevCount + 1 : Math.max(0, prevCount - 1);

    onLikeChange(photo.id, optimisticLiked, optimisticCount);
    setIsLiking(true);
    try {
      const result = await togglePhotoLike(photo.invitationId, photo.id);
      onLikeChange(photo.id, result.liked, result.likeCount);
    } catch {
      onLikeChange(photo.id, prevLiked, prevCount);
    } finally {
      setIsLiking(false);
    }
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
      await submitComment(text, replyingTo?.id, mentionedUserIds.length ? mentionedUserIds : undefined, pendingGif ?? undefined);
      setReplyingTo(null);
      setMentionedUserIds([]);
      setPendingGif(null);
    }
    setInputValue('');
  };

  const comments = (feedbackData?.rows ?? []).map((f) => {
    const isDeleted = !!f.deletedAt;
    const isMine = !isDeleted && !!me && f.participant.userId === me.id;
    const isEditing = editingComment?.id === f.id;
    const editingSlot: ReactNode = isEditing ? (
      <InlineCommentEditor
        initialValue={f.content ?? ''}
        onSubmit={(text) => handleCommentSubmit(text)}
        onCancel={() => setEditingComment(undefined)}
      />
    ) : undefined;
    return {
      id: f.id,
      authorName: getCommentAuthorName(f.participant.user),
      authorAvatarUrl: f.participant.user.profileImageUrl ?? undefined,
      content: f.content ?? '',
      gifUrl: f.gifUrl ?? undefined,
      createdAt: timeAgo(f.createdAt),
      variant: isDeleted ? ('deleted' as const) : isMine ? ('mine' as const) : ('default' as const),
      likeCount: !isDeleted ? getLikeCount(f.id, f.likeCount) : undefined,
      liked: !isDeleted ? getLiked(f.id, f.likedByMe ?? false) : undefined,
      onLike: !isDeleted ? () => toggleLike(f.id, getLiked(f.id, f.likedByMe ?? false), getLikeCount(f.id, f.likeCount)) : undefined,
      moreMenuItems: isMine ? buildMenuItems(f.id, f.content ?? '') : undefined,
      editingSlot,
      onReply: !isDeleted ? () => {
        setCommentsOpen(true);
        setReplyingTo({ id: f.id, authorName: f.participant.user.nickname ?? '' });
      } : undefined,
      replies: f.replies.map((r) => {
        const isReplyDeleted = !!r.deletedAt;
        const isReplyMine = !isReplyDeleted && !!me && r.participant.userId === me.id;
        const isReplyEditing = editingComment?.id === r.id;
        const replyEditingSlot: ReactNode = isReplyEditing ? (
          <InlineCommentEditor
            initialValue={r.content ?? ''}
            onSubmit={(text) => handleCommentSubmit(text)}
            onCancel={() => setEditingComment(undefined)}
          />
        ) : undefined;
        return {
          id: r.id,
          authorName: getCommentAuthorName(r.participant.user),
          authorInitialName: r.participant.user.name ?? undefined,
          authorAvatarUrl: r.participant.user.profileImageUrl ?? undefined,
          content: isReplyDeleted ? '' : (r.content ?? ''),
          gifUrl: !isReplyDeleted ? (r.gifUrl ?? undefined) : undefined,
          createdAt: timeAgo(r.createdAt),
          variant: isReplyDeleted ? ('deleted' as const) : isReplyMine ? ('mine' as const) : ('default' as const),
          likeCount: !isReplyDeleted ? getLikeCount(r.id, r.likeCount) : undefined,
          liked: !isReplyDeleted ? getLiked(r.id, r.likedByMe ?? false) : undefined,
          onLike: !isReplyDeleted ? () => toggleLike(r.id, getLiked(r.id, r.likedByMe ?? false), getLikeCount(r.id, r.likeCount)) : undefined,
          moreMenuItems: isReplyMine ? buildMenuItems(r.id, r.content ?? '') : undefined,
          editingSlot: replyEditingSlot,
        };
      }),
    };
  });

  return (
    <>
    <ConfirmModal
      open={showDeleteConfirm}
      onOpenChange={(o) => { if (!o) setShowDeleteConfirm(false); }}
      title="이 사진을 삭제하시겠습니까?"
      confirmLabel="삭제"
      confirmVariant="danger"
      onConfirm={() => deleteMutate(photo.id)}
      loading={isDeleting}
    />
    <PhotoViewer
      open={true}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      onClose={onClose}
      variant={isOwner ? 'owner' : 'default'}
      onMore={isOwner ? () => setShowDeleteConfirm(true) : undefined}
      onSave={handleSave}
      src={photo.url}
      likeCount={currentLikeCount}
      commentCount={feedbackData?.rows.reduce((acc, f) => acc + 1 + f.replies.length, 0) ?? 0}
      createdAt={timeAgo(photo.createdAt)}
      commentsOpen={commentsOpen}
      onCommentsOpenChange={setCommentsOpen}
      comments={comments}
      currentUserAvatarUrl={me?.profileImageUrl ?? undefined}
      currentUserInitialName={me?.name ?? undefined}
      currentUserNickname={me?.name ?? undefined}
      onCommentSubmit={handleCommentSubmit}
      commentPlaceholder={replyingTo ? `@${replyingTo.authorName}에게 답글...` : '댓글 남기기'}
      inputValue={inputValue}
      onInputValueChange={setInputValue}
      pendingGif={pendingGif}
      onGifClear={() => setPendingGif(null)}
      onGifButtonClick={() => setGifPickerOpen((v) => !v)}
      gifPicker={gifPickerOpen ? (
        <div className="mx-3 mb-1 overflow-hidden rounded-md border border-white/10 bg-black/80">
          <GifPicker
            onSelect={(url) => { setPendingGif(url); setGifPickerOpen(false); }}
            onClose={() => setGifPickerOpen(false)}
          />
        </div>
      ) : undefined}
      mentionDropdown={mentionQuery !== null ? (
        <div className="mx-3 mb-1 rounded-md border border-white/10 bg-black/80 overflow-y-auto max-h-[220px]">
          {isParticipantsLoading ? (
            <MentionListSkeleton count={3} />
          ) : filteredParticipants.length === 0 && !showAllOption ? (
            <p className="px-4 py-3 text-[13px] text-white/50">일치하는 참가자 없음</p>
          ) : (
            <ul>
              {showAllOption && (
                <li>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSelectMention('__all__', 'all');
                    }}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-white/10 transition-colors duration-150"
                  >
                    <span className="text-[14px] font-medium text-white">@all</span>
                    <span className="text-[12px] text-white/50">전체 참여자</span>
                  </button>
                </li>
              )}
              {filteredParticipants.map((p) => (
                <li key={p.user.id}>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSelectMention(p.user.id, getCommentAuthorName(p.user));
                    }}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-white/10 transition-colors duration-150"
                  >
                    <Avatar src={p.user.profileImageUrl ?? undefined} alt={getCommentAuthorName(p.user)} size="xs" name={getCommentAuthorName(p.user)} />
                    <span className="text-[14px] text-white">@{getCommentAuthorName(p.user)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : undefined}
      replyBanner={replyingTo ? (
        <div className="flex items-center justify-between border-t border-white/10 px-4 py-1.5">
          <span className="text-[12px] text-white/60">@{replyingTo.authorName}에게 답글</span>
          <button type="button" onClick={() => setReplyingTo(null)} className="text-[12px] text-white/40 hover:text-white/70">취소</button>
        </div>
      ) : undefined}
      liked={currentLiked}
      onLike={handleLike}
      isLiking={isLiking}
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
    </>
  );
}

function InlineCommentEditor({
  initialValue,
  onSubmit,
  onCancel,
}: {
  initialValue: string;
  onSubmit: (text: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(initialValue);
  return (
    <div className="flex flex-col gap-1 mt-1">
      <input
        autoFocus
        value={value}
        onChange={(e: ChangeEvent<HTMLInputElement>) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); if (value.trim()) onSubmit(value.trim()); }
          if (e.key === 'Escape') onCancel();
        }}
        className="w-full rounded-xs bg-white/10 px-3 py-1.5 text-[14px] text-white placeholder:text-white/50 outline-none"
      />
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onCancel} className="text-[12px] text-white/60 hover:text-white">
          취소
        </button>
        <button
          type="button"
          onClick={() => { if (value.trim()) onSubmit(value.trim()); }}
          className="text-[12px] text-primary font-semibold disabled:opacity-40"
          disabled={!value.trim()}
        >
          저장
        </button>
      </div>
    </div>
  );
}
