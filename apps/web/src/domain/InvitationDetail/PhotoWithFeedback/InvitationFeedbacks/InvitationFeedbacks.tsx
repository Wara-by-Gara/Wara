'use client';

import { useRef, useState } from 'react';
import { CommentItem } from '@/components/organisms/CommentItem/CommentItem';
import { useInvitationFeedback } from '@/hooks/useInvitationFeedbacks';
import { useParticipants } from '@/hooks/useParticipants';
import { CommentInputBar } from '@/components/organisms';
import { Icon } from '@/components/icons';
import { Avatar } from '@/components/primitives/Avatar';
import { timeAgo } from '@/utils/timeAge';
import { type Photo, getPhoto } from '@/lib/api/photos';
import PhotoDetailModal from '../PhotoDetailModal/PhotoDetailModal';

interface Props {
  invitationId: string;
  currentUserId: string | null;
  currentUserNickname?: string | null;
  currentUserProfileImageUrl?: string | null;
}

export default function InvitationFeedbacks({
  invitationId,
  currentUserId,
  currentUserNickname,
  currentUserProfileImageUrl,
}: Props) {
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
    isSubmitting
  } = useInvitationFeedback(invitationId);
  const allRows = data?.pages.flatMap((p) => p.rows) ?? [];
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ id: string; authorName: string } | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
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

  if (isLoading)
    return <p className="text-center text-gray-400 py-10">불러오는 중...</p>;
  if (isError)
    return (
      <p className="text-center text-gray-400 py-10">
        댓글을 불러오지 못했습니다
      </p>
    );

  return (
    <div className="mt-4">
      <div className="rounded-3xl border border-border bg-surface p-4">
        <h3 className="mb-3 text-[15px] font-bold text-text-primary">
          댓글 {allRows.length}
        </h3>
        <div className="flex flex-col">
        {allRows.map((f) => (
          <div key={f.id}>
            <CommentItem
              authorName={
                f.participant.userId === currentUserId
                  ? (currentUserNickname ?? f.participant.user?.nickname ?? f.participant.userId)
                  : (f.participant.user?.nickname ?? f.participant.userId)
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
                  authorName: r.participant.user?.nickname ?? r.participant.userId,
                  authorAvatarUrl:
                    r.participant.userId === currentUserId
                      ? (currentUserProfileImageUrl ?? undefined)
                      : (r.participant.user?.profileImageUrl ?? undefined),
                  content: r.deletedAt ? '' : r.content,
                  createdAt: timeAgo(r.createdAt),
                  variant: isReplyDeleted ? ('deleted' as const) : isReplyMine ? ('mine' as const) : ('default' as const),
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
        {hasNextPage && (data?.pages.at(-1)?.rows.length ?? 0) >= 10 && (
          <button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="text-sm text-gray-400 py-2 text-center disabled:opacity-50"
          >
            {isFetchingNextPage ? '불러오는 중...' : '더 보기'}
          </button>
        )}
        </div>
      </div>
      {replyingTo && (
        <div className="flex items-center justify-between border-t border-border bg-primary-soft px-4 py-1.5">
          <span className="text-[13px] text-primary">@{replyingTo.authorName}에게 답글</span>
          <button type="button" onClick={() => setReplyingTo(null)} className="text-[13px] text-text-tertiary hover:text-text-secondary">취소</button>
        </div>
      )}
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
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-surface-hover"
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
            authorName={currentUserNickname ?? undefined}
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
      {selectedPhoto && (
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
      )}
    </div>
  );
}
