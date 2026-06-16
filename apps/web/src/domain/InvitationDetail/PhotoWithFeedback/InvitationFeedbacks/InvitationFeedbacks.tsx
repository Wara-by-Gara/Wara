'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CommentItem } from '@/components/domain';
import { useInvitationFeedback } from '@/hooks/useInvitationFeedbacks';
import { useMe } from '@/hooks/useUsers';
import { useParticipants } from '@/hooks/useParticipants';
import { CommentInputBar, GifPicker } from '@/components/organisms';
import { CommentListSkeleton, MentionListSkeleton } from '@/components/organisms/Skeleton';
import { Avatar } from "@wara/ui";
import { timeAgo } from '@/utils/timeAge';
import { cn } from '@/lib/cn';
import { type Photo, getPhoto } from '@/lib/api/photos';
import PhotoDetailModal from '../PhotoDetailModal/PhotoDetailModal';
import { ParticipantProfileModal } from '@/components/domain';
import { getCommentAuthorName } from '@/domain/InvitationDetail/types';

interface Props {
  invitationId: string;
  isDarkBg?: boolean;
}

export default function InvitationFeedbacks({ invitationId, isDarkBg }: Props) {
  const { data: me } = useMe();
  const currentUserId = me?.id ?? null;
  const currentUserProfileImageUrl = me?.profileImageUrl ?? null;
  const currentUserDisplayName = me?.name ?? null;

  const searchParams = useSearchParams();
  const sectionRef = useRef<HTMLDivElement>(null);

  const {
    data,
    submitComment,
    fetchNextPage,
    canLoadMore,
    total,
    isFetchingNextPage,
    removeComment,
    editComment,
    isSubmitting,
    toggleLike,
    getLiked,
    getLikeCount,
  } = useInvitationFeedback(invitationId);
  const allRows = data?.pages.flatMap((p) => p.rows) ?? [];
  const commentCount = total ?? allRows.length;

  // 댓글 알림 클릭으로 진입(?focus=comments) 시 댓글 섹션으로 스크롤.
  // 위쪽 Album 이미지가 비동기 로드되며 레이아웃 높이가 변하므로 한 틱 미뤄서 스크롤한다.
  useEffect(() => {
    if (searchParams.get('focus') !== 'comments') return;
    const timer = setTimeout(() => {
      sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 300);
    return () => clearTimeout(timer);
  }, [searchParams]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [replyingTo, setReplyingTo] = useState<{
    id: string;
    authorName: string;
  } | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [profileModal, setProfileModal] = useState<{
    userId: string;
    isHost: boolean;
    isWithdrawn?: boolean;
  } | null>(null);
  const [likedMap, setLikedMap] = useState<Map<string, boolean>>(new Map());
  const [likeCountMap, setLikeCountMap] = useState<Map<string, number>>(
    new Map(),
  );
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingPreview, setPendingPreview] = useState<string | null>(null);
  const [pendingGif, setPendingGif] = useState<string | null>(null);
  const [gifPickerOpen, setGifPickerOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [inputValue, setInputValue] = useState('');
  const [mentionedUserIds, setMentionedUserIds] = useState<string[]>([]);

  const { data: participantsData, isLoading: isParticipantsLoading } =
    useParticipants(invitationId);
  const allParticipants = participantsData?.participants ?? [];

  // 마지막 @ 이후 텍스트 추출
  const mentionQuery = (() => {
    const match = inputValue.match(/@(\S*)$/);
    return match ? match[1] : null;
  })();

  const filteredParticipants =
    mentionQuery !== null
      ? allParticipants.filter((p) =>
          getCommentAuthorName(p.user)
            .toLowerCase()
            .includes((mentionQuery ?? '').toLowerCase()),
        )
      : [];

  const showAllOption = mentionQuery != null && 'all'.includes(mentionQuery.toLowerCase());

  const handleSelectMention = (userId: string, nickname: string) => {
    if (userId === '__all__') {
      const allUserIds = allParticipants
        .map((p) => p.user.id)
        .filter((id) => id !== currentUserId);
      setMentionedUserIds([...new Set(allUserIds)]);
      setInputValue(inputValue.replace(/@\S*$/, '@all '));
    } else {
      const newValue = inputValue.replace(/@\S*$/, `@${nickname} `);
      setInputValue(newValue);
      setMentionedUserIds((prev) => [...new Set([...prev, userId])]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    e.target.value = '';
    if (!file) return;
    setPendingFile(file);
    setPendingGif(null);
    const reader = new FileReader();
    reader.onload = () => setPendingPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const clearPendingFile = () => {
    setPendingFile(null);
    setPendingPreview(null);
  };

  const handleGifSelect = (gifUrl: string) => {
    setPendingGif(gifUrl);
    clearPendingFile();
    setGifPickerOpen(false);
  };

  const clearPendingGif = () => setPendingGif(null);

  const handlePhotoClick = async (photoId: string) => {
    const photo = await getPhoto(invitationId, photoId);
    setSelectedPhoto(photo);
  };

  return (
    <div ref={sectionRef} id="comments" className="mt-4">
      <div>
        <h3 className={cn('mb-3 text-[15px] font-bold', isDarkBg ? 'text-white' : 'text-text-primary')}>
          댓글 {commentCount}
        </h3>

        {replyingTo ? (
          <div className="mt-2 flex items-center justify-between rounded-md border border-border bg-primary-soft px-4 py-1.5">
            <span className="text-[13px] text-primary">
              @{replyingTo.authorName}에게 답글
            </span>
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
            <div className="relative size-12 shrink-0 overflow-hidden rounded-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={pendingPreview}
                alt=""
                className="size-full object-cover"
              />
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
          <div className="mx-3 mb-1 rounded-md border border-border bg-surface shadow-sm overflow-y-auto max-h-[220px]">
            {isParticipantsLoading ? (
              <MentionListSkeleton count={3} />
            ) : filteredParticipants.length === 0 && !showAllOption ? (
              <p className="px-4 py-3 text-[13px] text-text-tertiary">
                일치하는 참가자 없음
              </p>
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
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 transition-colors duration-150"
                    >
                      <span className="text-[14px] font-medium text-text-primary">@all</span>
                      <span className="text-[12px] text-text-tertiary">전체 참여자</span>
                    </button>
                  </li>
                )}
                {filteredParticipants.map((p) => (
                  <li key={p.user.id}>
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault(); // input blur 방지
                        handleSelectMention(
                          p.user.id,
                          getCommentAuthorName(p.user),
                        );
                      }}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 transition-colors duration-150"
                    >
                      <Avatar
                        src={p.user.profileImageUrl ?? undefined}
                        alt={getCommentAuthorName(p.user)}
                        size="xs"
                        name={getCommentAuthorName(p.user)[0]}
                      />
                      <span className="text-[14px] text-text-primary">
                        @{getCommentAuthorName(p.user)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
          className="hidden"
          onChange={handleFileSelect}
        />
        <CommentInputBar
          variant="glass"
          className="border-t-0"
          placeholder={
            replyingTo ? `@${replyingTo.authorName}에게 답글...` : '댓글 남기기'
          }
          value={inputValue}
          onValueChange={setInputValue}
          pendingGif={pendingGif}
          onGifClear={clearPendingGif}
          onGifButtonClick={() => setGifPickerOpen((v) => !v)}
          onPhotoButtonClick={() => fileInputRef.current?.click()}
          hasPendingPhoto={!!pendingFile}
          highlightMentions
          onSubmit={async (text) => {
            await submitComment(
              text,
              replyingTo?.id,
              pendingFile ?? undefined,
              mentionedUserIds.length ? mentionedUserIds : undefined,
              pendingGif ?? undefined,
            );
            setReplyingTo(null);
            clearPendingFile();
            clearPendingGif();
            setGifPickerOpen(false);
            setInputValue('');
            setMentionedUserIds([]);
          }}
          state={isSubmitting ? 'submitting' : 'default'}
        />
        {gifPickerOpen ? (
          <GifPicker
            onSelect={handleGifSelect}
            onClose={() => setGifPickerOpen(false)}
          />
        ) : null}

        <div className="mt-2 flex flex-col">
          {allRows.map((f) => (
            <div key={f.id}>
              <CommentItem
                isDarkBg={isDarkBg}
                authorName={
                  f.participant.userId === currentUserId
                    ? (currentUserDisplayName ??
                      getCommentAuthorName(f.participant.user))
                    : getCommentAuthorName(f.participant.user)
                }
                authorAvatarUrl={
                  f.participant.userId === currentUserId
                    ? (currentUserProfileImageUrl ?? undefined)
                    : (f.participant.user?.profileImageUrl ?? undefined)
                }
                content={f.deletedAt ? '' : (f.content ?? '')}
                gifUrl={!f.deletedAt ? (f.gifUrl ?? undefined) : undefined}
                createdAt={timeAgo(f.createdAt)}
                imageUrl={f.attachedPhoto?.url ?? f.photo?.url ?? undefined}
                onImageClick={
                  f.attachedPhoto || f.photo
                    ? () => handlePhotoClick((f.attachedPhoto ?? f.photo)!.id)
                    : undefined
                }
                likeCount={
                  !f.deletedAt ? getLikeCount(f.id, f.likeCount) : undefined
                }
                liked={
                  !f.deletedAt
                    ? getLiked(f.id, f.likedByMe ?? false)
                    : undefined
                }
                onLike={
                  !f.deletedAt
                    ? () =>
                        toggleLike(
                          f.id,
                          getLiked(f.id, f.likedByMe ?? false),
                          getLikeCount(f.id, f.likeCount),
                        )
                    : undefined
                }
                onAvatarClick={
                  !f.deletedAt
                    ? () =>
                        setProfileModal({
                          userId: f.participant.userId,
                          isHost: f.participant.memberRole === 'HOST',
                          isWithdrawn: f.participant.user?.isWithdrawn,
                        })
                    : undefined
                }
                onReply={
                  !f.deletedAt
                    ? () =>
                        setReplyingTo({
                          id: f.id,
                          authorName:
                            f.participant.user?.nickname ??
                            f.participant.userId,
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
                        : 'default'
                }
                moreMenuItems={
                  f.participant.userId === currentUserId && !f.deletedAt
                    ? [
                        {
                          label: '수정',
                          onClick: () => {
                            setEditingId(f.id);
                            setEditContent(f.content ?? '');
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
                  const isReplyMine =
                    !isReplyDeleted && r.participant.userId === currentUserId;
                  const isReplyEditing = editingId === r.id;
                  return {
                    id: r.id,
                    authorName: getCommentAuthorName(r.participant.user),
                    authorAvatarUrl:
                      r.participant.userId === currentUserId
                        ? (currentUserProfileImageUrl ?? undefined)
                        : (r.participant.user?.profileImageUrl ?? undefined),
                    content: r.deletedAt ? '' : (r.content ?? ''),
                    gifUrl: !r.deletedAt ? (r.gifUrl ?? undefined) : undefined,
                    createdAt: timeAgo(r.createdAt),
                    variant: isReplyDeleted
                      ? ('deleted' as const)
                      : isReplyMine
                        ? ('mine' as const)
                        : ('default' as const),
                    likeCount: !isReplyDeleted
                      ? getLikeCount(r.id, r.likeCount)
                      : undefined,
                    liked: !isReplyDeleted
                      ? getLiked(r.id, r.likedByMe ?? false)
                      : undefined,
                    onLike: !isReplyDeleted
                      ? () =>
                          toggleLike(
                            r.id,
                            getLiked(r.id, r.likedByMe ?? false),
                            getLikeCount(r.id, r.likeCount),
                          )
                      : undefined,
                    moreMenuItems: isReplyMine
                      ? [
                          {
                            label: '수정',
                            onClick: () => {
                              setEditingId(r.id);
                              setEditContent(r.content ?? '');
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
                        <button
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
            </div>
          ))}
          {canLoadMore ? (
            <>
              <button
                type="button"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="mt-2 w-full py-2 text-center text-[13px] font-medium text-brand disabled:opacity-50"
              >
                더보기
              </button>
              {isFetchingNextPage ? <CommentListSkeleton count={1} /> : null}
            </>
          ) : null}
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
          onOpenChange={(open) => {
            if (!open) setProfileModal(null);
          }}
          userId={profileModal.userId}
          isHost={profileModal.isHost}
          isWithdrawn={profileModal.isWithdrawn}
        />
      )}
    </div>
  );
}
