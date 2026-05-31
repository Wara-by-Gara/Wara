'use client';

import { useRef, useState } from 'react';
import { CommentItem } from '@/components/organisms/CommentItem/CommentItem';
import { useInvitationFeedback } from '@/hooks/useInvitationFeedbacks';
import { useMe } from '@/hooks/useUsers';
import { useParticipants } from '@/hooks/useParticipants';
import { getCommentAuthorName } from '@/domain/InvitationDetail/types';
import { CommentInputBar } from '@/components/organisms';
import { Icon } from '@/components/icons';
import { Avatar } from '@/components/primitives/Avatar';
import { timeAgo } from '@/utils/timeAge';
import { type Photo, getPhoto } from '@/lib/api/photos';
import PhotoDetailModal from '../PhotoDetailModal/PhotoDetailModal';
import { ParticipantProfileModal } from '@/components/organisms/ParticipantProfileModal/ParticipantProfileModal';

interface Props {
  invitationId: string;
}

export default function InvitationFeedbacks({ invitationId }: Props) {
  const { data: me } = useMe();
  const currentUserId = me?.id ?? null;
  const currentUserProfileImageUrl = me?.profileImageUrl ?? null;
  const currentUserDisplayName = me?.name ?? null;

  const {
    data,
    submitComment,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    removeComment,
    editComment,
    isSubmitting,
    toggleLike,
    getLiked,
    getLikeCount,
  } = useInvitationFeedback(invitationId);
  const allRows = data?.pages.flatMap((p) => p.rows) ?? [];
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ id: string; authorName: string } | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [profileModal, setProfileModal] = useState<{ userId: string; isHost: boolean } | null>(null);
  const [likedMap, setLikedMap] = useState<Map<string, boolean>>(new Map());
  const [likeCountMap, setLikeCountMap] = useState<Map<string, number>>(new Map());
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingPreview, setPendingPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [inputValue, setInputValue] = useState('');
  const [mentionedUserIds, setMentionedUserIds] = useState<string[]>([]);

  const { data: participantsData, isLoading: isParticipantsLoading } = useParticipants(invitationId);
  const allParticipants = participantsData?.participants ?? [];

  // 마지막 @ 이후 텍스트 추출
  const mentionQuery = (() => {
    const match = inputValue.match(/@(\S*)$/);
    return match ? match[1] : null;
  })();

  const filteredParticipants = mentionQuery !== null
    ? allParticipants.filter((p) =>
        (p.user.nickname ?? '').toLowerCase().includes(mentionQuery!.toLowerCase())
      )
    : [];

  const handleSelectMention = (userId: string, nickname: string) => {
    const newValue = inputValue.replace(/@\S*$/, `@${nickname} `);
    setInputValue(newValue);
    setMentionedUserIds((prev) => [...new Set([...prev, userId])]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    e.target.value = '';
    if (!file) return;
    setPendingFile(file);
    const reader = new FileReader();
    reader.onload = () => setPendingPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const clearPendingFile = () => {
    setPendingFile(null);
    setPendingPreview(null);
  };

  const handlePhotoClick = async (photoId: string) => {
    const photo = await getPhoto(invitationId, photoId);
    setSelectedPhoto(photo);
  };

  return (
    <div className="mt-4">
      <div className="flex flex-col">
        {allRows.map((f) => (
          <div key={f.id}>
            <CommentItem
              authorName={
                f.participant.userId === currentUserId
                  ? (currentUserDisplayName ?? getCommentAuthorName(f.participant.user))
                  : getCommentAuthorName(f.participant.user)
              }
              authorAvatarUrl={
                f.participant.userId === currentUserId
                  ? (currentUserProfileImageUrl ?? undefined)
                  : (f.participant.user?.profileImageUrl ?? undefined)
              }
              content={f.deletedAt ? '' : f.content}
              createdAt={timeAgo(f.createdAt)}
              imageUrl={(f.attachedPhoto?.url ?? f.photo?.url) ?? undefined}
              onImageClick={(f.attachedPhoto || f.photo) ? () => handlePhotoClick((f.attachedPhoto ?? f.photo)!.id) : undefined}
              likeCount={!f.deletedAt ? getLikeCount(f.id, f.likeCount) : undefined}
              liked={!f.deletedAt ? getLiked(f.id, f.likedByMe ?? false) : undefined}
              onLike={!f.deletedAt ? () => toggleLike(f.id, getLiked(f.id, f.likedByMe ?? false), getLikeCount(f.id, f.likeCount)) : undefined}
              onAvatarClick={!f.deletedAt ? () => setProfileModal({ userId: f.participant.userId, isHost: f.participant.memberRole === 'HOST' }) : undefined}
              onReply={!f.deletedAt ? () => setReplyingTo({ id: f.id, authorName: f.participant.user?.nickname ?? f.participant.userId }) : undefined}
              variant={
                f.deletedAt
                  ? 'deleted'
                  : editingId === f.id
                    ? 'editing'
                    : f.participant.userId === currentUserId
                      ? 'mine'
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
                      className="flex-1 border rounded px-2 py-1 text-sm"
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                    />
                    <button
                      className="text-xs text-blue-500"
                      onClick={async () => {
                        await editComment(f.id, editContent, f.photo?.id);
                        setEditingId(null);
                      }}
                    >
                      저장
                    </button>
                    <button
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
                  authorName: getCommentAuthorName(r.participant.user),
                  authorAvatarUrl:
                    r.participant.userId === currentUserId
                      ? (currentUserProfileImageUrl ?? undefined)
                      : (r.participant.user?.profileImageUrl ?? undefined),
                  onAvatarClick: !isReplyDeleted ? () => setProfileModal({ userId: r.participant.userId, isHost: r.participant.memberRole === 'HOST' }) : undefined,
                  content: r.deletedAt ? '' : r.content,
                  createdAt: timeAgo(r.createdAt),
                  variant: isReplyDeleted ? ('deleted' as const) : isReplyMine ? ('mine' as const) : ('default' as const),
                  likeCount: !isReplyDeleted ? getLikeCount(r.id, r.likeCount) : undefined,
                  liked: !isReplyDeleted ? getLiked(r.id, r.likedByMe ?? false) : undefined,
                  onLike: !isReplyDeleted ? () => toggleLike(r.id, getLiked(r.id, r.likedByMe ?? false), getLikeCount(r.id, r.likeCount)) : undefined,
                  moreMenuItems: isReplyMine ? [
                    {
                      label: '수정',
                      onClick: () => { setEditingId(r.id); setEditContent(r.content); },
                      className: 'text-blue-500',
                    },
                    {
                      label: '삭제',
                      onClick: () => removeComment(r.id, f.photo?.id),
                      className: 'text-red-500',
                    },
                  ] : undefined,
                  editingSlot: isReplyEditing ? (
                    <div className="flex gap-2">
                      <input
                        className="flex-1 border rounded px-2 py-1 text-sm"
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                      />
                      <button
                        className="text-xs text-blue-500"
                        onClick={async () => {
                          await editComment(r.id, editContent, f.photo?.id);
                          setEditingId(null);
                        }}
                      >
                        저장
                      </button>
                      <button className="text-xs text-gray-400" onClick={() => setEditingId(null)}>
                        취소
                      </button>
                    </div>
                  ) : undefined,
                };
              })}
            />
          </div>
        ))}
        {hasNextPage ? (
          <button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? '불러오는 중...' : '더보기'}
          </button>
        ) : null}
      </div>

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
      {pendingPreview && (
        <div className="flex items-center gap-2 border-t border-border bg-surface px-4 py-2">
          <div className="relative size-12 shrink-0 overflow-hidden rounded-lg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={pendingPreview} alt="" className="size-full object-cover" />
          </div>
          <button
            type="button"
            onClick={clearPendingFile}
            className="text-[12px] text-text-tertiary hover:text-text-secondary"
          >
            취소
          </button>
        </div>
      )}
      {mentionQuery !== null && (
        <div className="mx-3 mb-1 rounded-2xl border border-border bg-surface shadow-sm overflow-hidden">
          {isParticipantsLoading ? (
            <p className="px-4 py-3 text-[13px] text-text-tertiary">불러오는 중...</p>
          ) : filteredParticipants.length === 0 ? (
            <p className="px-4 py-3 text-[13px] text-text-tertiary">일치하는 참가자 없음</p>
          ) : (
            <ul>
              {filteredParticipants.map((p) => (
                <li key={p.user.id}>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault(); // input blur 방지
                      handleSelectMention(p.user.id, p.user.nickname ?? p.user.id);
                    }}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover-emphasis-sm"
                  >
                    <Avatar src={p.user.profileImageUrl ?? undefined} alt={p.user.nickname ?? ''} size="xs" initial={p.user.nickname?.[0]} />
                    <span className="text-[14px] text-text-primary">@{p.user.nickname}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      <div className="flex items-center">
        <button
          type="button"
          aria-label="사진 첨부"
          onClick={() => fileInputRef.current?.click()}
          className="flex size-11 shrink-0 items-center justify-center text-text-tertiary hover:text-text-secondary"
        >
          <Icon name="camera" size="sm" color="currentColor" decorative />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
          className="hidden"
          onChange={handleFileSelect}
        />
        <div className="flex-1">
          <CommentInputBar
            avatarUrl={currentUserProfileImageUrl ?? undefined}
            authorName={currentUserDisplayName ?? undefined}
            placeholder={replyingTo ? `@${replyingTo.authorName}에게 답글...` : '댓글 남기기'}
            value={inputValue}
            onValueChange={setInputValue}
            onSubmit={async (text) => {
              await submitComment(text, replyingTo?.id, pendingFile ?? undefined, mentionedUserIds.length ? mentionedUserIds : undefined);
              setReplyingTo(null);
              clearPendingFile();
              setInputValue('');
              setMentionedUserIds([]);
            }}
            state={isSubmitting ? 'submitting' : 'default'}
          />
        </div>
      </div>
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
      {profileModal && (
        <ParticipantProfileModal
          open={true}
          onOpenChange={(open) => { if (!open) setProfileModal(null); }}
          userId={profileModal.userId}
          isHost={profileModal.isHost}
        />
      )}
    </div>
  );
}
