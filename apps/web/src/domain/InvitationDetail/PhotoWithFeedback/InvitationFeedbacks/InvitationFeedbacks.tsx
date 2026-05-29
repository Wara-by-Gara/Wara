'use client';

import { useState } from 'react';
import { CommentItem } from '@/components/organisms/CommentItem/CommentItem';
import { useInvitationFeedback } from '@/hooks/useInvitationFeedbacks';
import { useMe } from '@/hooks/useUsers';
import { CommentInputBar } from '@/components/organisms';
import { Button } from '@/components/primitives/Button';
import { timeAgo } from '@/utils/timeAge';
import { type Photo, getPhoto } from '@/lib/api/photos';
import PhotoDetailModal from '../PhotoDetailModal/PhotoDetailModal';

interface Props {
  invitationId: string;
}

export default function InvitationFeedbacks({ invitationId }: Props) {
  const { data: me } = useMe();
  const currentUserId = me?.id ?? null;
  const currentUserName = me?.name ?? null;
  const currentUserNickname = me?.nickname ?? null;
  const currentUserProfileImageUrl = me?.profileImageUrl ?? null;

  const {
    data,
    isLoading,
    isError,
    submitComment,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    removeComment,
    editComment,
    isSubmitting,
  } = useInvitationFeedback(invitationId);
  const allRows = data?.pages.flatMap((p) => p.rows) ?? [];
  const totalCount = data?.pages[0]?.total ?? allRows.length;
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ id: string; authorName: string } | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [likedMap, setLikedMap] = useState<Map<string, boolean>>(new Map());
  const [likeCountMap, setLikeCountMap] = useState<Map<string, number>>(new Map());

  const handlePhotoClick = async (photoId: string) => {
    const photo = await getPhoto(invitationId, photoId);
    setSelectedPhoto(photo);
  };

  const renderCommentList = () =>
    allRows.map((f) => (
      <CommentItem
        key={f.id}
        authorName={
          f.participant.userId === currentUserId
            ? (currentUserNickname ?? f.participant.user?.nickname ?? f.participant.user?.name ?? f.participant.userId)
            : (f.participant.user?.nickname ?? f.participant.user?.name ?? f.participant.userId)
        }
        authorInitialName={
          f.participant.userId === currentUserId
            ? (currentUserName ?? f.participant.user?.name ?? undefined)
            : (f.participant.user?.name ?? undefined)
        }
        authorAvatarUrl={
          f.participant.userId === currentUserId
            ? (currentUserProfileImageUrl ?? undefined)
            : (f.participant.user?.profileImageUrl ?? undefined)
        }
        content={f.deletedAt ? '' : f.content}
        createdAt={timeAgo(f.createdAt)}
        imageUrl={f.photo?.url ?? undefined}
        onImageClick={f.photo ? () => handlePhotoClick(f.photo!.id) : undefined}
        onReply={
          !f.deletedAt
            ? () =>
                setReplyingTo({
                  id: f.id,
                  authorName: f.participant.user?.nickname ?? f.participant.userId,
                })
            : undefined
        }
        variant={
          f.deletedAt
            ? 'deleted'
            : editingId === f.id
              ? 'editing'
              : f.participant.userId === currentUserId
                ? 'mine'
                : f.participant.memberRole === 'HOST'
                  ? 'host'
                  : 'default'
        }
        moreMenuItems={
          f.participant.userId === currentUserId && !f.deletedAt
            ? [
                {
                  label: '수정',
                  onClick: () => {
                    setEditingId(f.id);
                    setEditContent(f.content);
                  },
                  className: 'text-blue-500',
                },
                {
                  label: '삭제',
                  onClick: () => removeComment(f.id, f.photo?.id),
                  className: 'text-red-500',
                },
              ]
            : undefined
        }
        editingSlot={
          editingId === f.id ? (
            <div className="flex gap-2">
              <input
                className="flex-1 rounded border px-2 py-1 text-sm"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
              />
              <button
                type="button"
                className="text-xs text-blue-500"
                onClick={async () => {
                  await editComment(f.id, editContent, f.photo?.id);
                  setEditingId(null);
                }}
              >
                저장
              </button>
              <button
                type="button"
                className="text-xs text-gray-400"
                onClick={() => setEditingId(null)}
              >
                취소
              </button>
            </div>
          ) : undefined
        }
        replies={f.replies.map((r) => {
          const isReplyDeleted = !!r.deletedAt;
          const isReplyMine = !isReplyDeleted && r.participant.userId === currentUserId;
          const isReplyEditing = editingId === r.id;
          return {
            id: r.id,
            authorName: r.participant.user?.nickname ?? r.participant.user?.name ?? r.participant.userId,
            authorInitialName: r.participant.user?.name ?? undefined,
            authorAvatarUrl:
              r.participant.userId === currentUserId
                ? (currentUserProfileImageUrl ?? undefined)
                : (r.participant.user?.profileImageUrl ?? undefined),
            content: r.deletedAt ? '' : r.content,
            createdAt: timeAgo(r.createdAt),
            variant: isReplyDeleted ? ('deleted' as const) : isReplyMine ? ('mine' as const) : ('default' as const),
            moreMenuItems: isReplyMine
              ? [
                  {
                    label: '수정',
                    onClick: () => {
                      setEditingId(r.id);
                      setEditContent(r.content);
                    },
                    className: 'text-blue-500',
                  },
                  {
                    label: '삭제',
                    onClick: () => removeComment(r.id, f.photo?.id),
                    className: 'text-red-500',
                  },
                ]
              : undefined,
            editingSlot: isReplyEditing ? (
              <div className="flex gap-2">
                <input
                  className="flex-1 rounded border px-2 py-1 text-sm"
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                />
                <button
                  type="button"
                  className="text-xs text-blue-500"
                  onClick={async () => {
                    await editComment(r.id, editContent, f.photo?.id);
                    setEditingId(null);
                  }}
                >
                  저장
                </button>
                <button
                  type="button"
                  className="text-xs text-gray-400"
                  onClick={() => setEditingId(null)}
                >
                  취소
                </button>
              </div>
            ) : undefined,
          };
        })}
      />
    ));

  return (
    <div className="mt-4">
      <section className="rounded-3xl border border-border bg-surface p-4">
        <h3 className="mb-2 text-[15px] font-bold text-text-primary">댓글 {totalCount}</h3>

        {isLoading ? (
          <p className="py-4 text-center text-[13px] text-text-tertiary">불러오는 중...</p>
        ) : isError ? (
          <p className="py-4 text-center text-[13px] text-text-tertiary">댓글을 불러오지 못했습니다</p>
        ) : allRows.length === 0 ? (
          <p className="py-4 text-center text-[13px] text-text-tertiary">첫 댓글을 남겨보세요</p>
        ) : (
          <div className="divide-y divide-border">{renderCommentList()}</div>
        )}

        {hasNextPage ? (
          <Button
            type="button"
            variant="outline"
            size="md"
            fullWidth
            className="mt-3"
            disabled={isFetchingNextPage}
            onClick={() => fetchNextPage()}
          >
            {isFetchingNextPage ? '불러오는 중...' : '더보기'}
          </Button>
        ) : null}
      </section>

      {replyingTo ? (
        <div className="mt-2 flex items-center justify-between rounded-2xl border border-border bg-primary-soft px-4 py-1.5">
          <span className="text-[13px] text-primary">@{replyingTo.authorName}에게 답글</span>
          <button
            type="button"
            onClick={() => setReplyingTo(null)}
            className="text-[13px] text-text-tertiary hover:text-text-secondary"
          >
            취소
          </button>
        </div>
      ) : null}

      <CommentInputBar
        className="mt-2"
        avatarUrl={currentUserProfileImageUrl ?? undefined}
        authorName={currentUserNickname ?? undefined}
        authorInitialName={currentUserName ?? undefined}
        placeholder={replyingTo ? `@${replyingTo.authorName}에게 답글...` : '댓글 남기기'}
        onSubmit={async (text) => {
          await submitComment(text, replyingTo?.id);
          setReplyingTo(null);
        }}
        state={isSubmitting ? 'submitting' : 'default'}
      />

      {selectedPhoto ? (
        <PhotoDetailModal
          photos={[selectedPhoto]}
          initialIndex={0}
          onClose={() => setSelectedPhoto(null)}
          likedMap={likedMap}
          likeCountMap={likeCountMap}
          onLikeChange={(photoId, liked, likeCount) => {
            setLikedMap((prev) => new Map(prev).set(photoId, liked));
            setLikeCountMap((prev) => new Map(prev).set(photoId, likeCount));
          }}
        />
      ) : null}
    </div>
  );
}
