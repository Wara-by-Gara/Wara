"use client";

import { useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { TopAppBar, ConfirmDialog, EmptyState, ErrorState } from "@wara/ui";
import { CommentBox, CommentItem } from "@/components/domain";
import { CommentListSkeleton } from "@/components/organisms/Skeleton";
import { mobileMainScroll, mobileMainCenter } from "@/lib/mobilePageLayout";
import { cn } from "@/lib/cn";
import { useInvitationFeedback } from "@/hooks/useInvitationFeedbacks";
import { useMe } from "@/hooks/useUsers";
import { getCommentAuthorName } from "@/domain/InvitationDetail/types";
import { timeAgo } from "@/utils/timeAge";
import { ParticipantProfileModal } from "@/components/domain";

interface Props {
  invitationId: string;
}

export const Comments = ({ invitationId }: Props) => {
  const router = useRouter();
  const { data: me } = useMe();
  const { data, isLoading, isError, submitComment, editComment, removeComment } =
    useInvitationFeedback(invitationId);

  const [editingComment, setEditingComment] = useState<{ id: string; content: string } | undefined>();
  const [deletingCommentId, setDeletingCommentId] = useState<string | undefined>();
  const [isDeleting, setIsDeleting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{ id: string; authorName: string } | null>(null);
  const [profileModal, setProfileModal] = useState<{ userId: string; isHost: boolean } | null>(null);

  const feedbacks = data?.pages.flatMap((p) => p.rows) ?? [];
  const totalCount = data?.pages[0]?.total ?? feedbacks.length;

  const buildMenuItems = (id: string, content: string) => [
    {
      label: "수정",
      onClick: () => setEditingComment({ id, content }),
      className: "text-gray-900",
    },
    {
      label: "삭제",
      onClick: () => setDeletingCommentId(id),
      className: "text-danger",
    },
  ];

  const handleEdit = async (text: string) => {
    if (!editingComment) return;
    await editComment(editingComment.id, text);
    setEditingComment(undefined);
  };

  const handleDelete = async () => {
    if (!deletingCommentId) return;
    setIsDeleting(true);
    try {
      await removeComment(deletingCommentId);
      setDeletingCommentId(undefined);
    } finally {
      setIsDeleting(false);
    }
  };

  const mainCentered = isError || (!isLoading && feedbacks.length === 0);

  return (
    <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col overflow-x-hidden bg-background">
      <TopAppBar
        className="shrink-0"
        title={`댓글 ${totalCount}`}
        onBack={() => router.back()}
      />

      <main className={cn(mainCentered ? mobileMainCenter : mobileMainScroll)}>
        {isLoading ? (
          <CommentListSkeleton />
        ) : isError ? (
          <ErrorState title="댓글을 불러오지 못했어요" onRetry={() => {}} />
        ) : feedbacks.length === 0 ? (
          <EmptyState
            icon="message-circle"
            title="댓글이 아직 없어요"
            description="첫 댓글을 남겨보세요"
          />
        ) : (
          <div className="divide-y divide-border">
            {feedbacks.map((f) => {
              const isDeleted = !!f.deletedAt;
              const isMine = !isDeleted && !!me && f.participant.userId === me.id;
              const isEditing = editingComment?.id === f.id;
              return (
                <CommentItem
                  key={f.id}
                  variant={isDeleted ? "deleted" : isEditing ? "editing" : isMine ? "mine" : "default"}
                  authorName={getCommentAuthorName(f.participant.user)}
                  authorInitialName={f.participant.user.name ?? undefined}
                  authorHandle={f.participant.user.nickname ?? undefined}
                  onAvatarClick={!isDeleted ? () => setProfileModal({ userId: f.participant.userId, isHost: f.participant.memberRole === 'HOST' }) : undefined}
                  onReply={!isDeleted ? () => setReplyingTo({ id: f.id, authorName: f.participant.user.nickname ?? '' }) : undefined}
                  authorAvatarUrl={f.participant.user.profileImageUrl ?? undefined}
                  createdAt={timeAgo(f.createdAt)}
                  content={f.content}
                  replies={f.replies.map((r) => {
                    const isReplyDeleted = !!r.deletedAt;
                    const isReplyMine = !isReplyDeleted && !!me && r.participant.userId === me.id;
                    const isReplyEditing = editingComment?.id === r.id;
                    return {
                      id: r.id,
                      authorName: getCommentAuthorName(r.participant.user),
                      authorInitialName: r.participant.user.name ?? undefined,
                      authorHandle: r.participant.user.nickname ?? undefined,
                      authorAvatarUrl: r.participant.user.profileImageUrl ?? undefined,
                      onAvatarClick: !isReplyDeleted ? () => setProfileModal({ userId: r.participant.userId, isHost: r.participant.memberRole === 'HOST' }) : undefined,
                      createdAt: timeAgo(r.createdAt),
                      content: r.content ?? '',
                      variant: isReplyDeleted ? ("deleted" as const) : isReplyMine ? ("mine" as const) : ("default" as const),
                      moreMenuItems: isReplyMine ? buildMenuItems(r.id, r.content ?? '') : undefined,
                      editingSlot: isReplyEditing ? (
                        <InlineCommentEditor
                          initialValue={r.content ?? ''}
                          onSubmit={handleEdit}
                          onCancel={() => setEditingComment(undefined)}
                        />
                      ) : undefined,
                    };
                  })}
                  moreMenuItems={isMine ? buildMenuItems(f.id, f.content ?? '') : undefined}
                  editingSlot={isEditing ? (
                    <InlineCommentEditor
                      initialValue={f.content ?? ''}
                      onSubmit={handleEdit}
                      onCancel={() => setEditingComment(undefined)}
                    />
                  ) : undefined}
                />
              );
            })}
          </div>
        )}
      </main>

      <div className="shrink-0 pt-2">
        {replyingTo && (
          <div className="flex items-center justify-between border-t border-border bg-primary-soft px-4 py-1.5">
            <span className="text-[13px] text-primary">@{replyingTo.authorName}에게 답글</span>
            <button type="button" onClick={() => setReplyingTo(null)} className="text-[13px] text-text-tertiary hover:text-text-secondary">취소</button>
          </div>
        )}
        <CommentBox
          placeholder={replyingTo ? `@${replyingTo.authorName}에게 답글...` : '댓글 남기기'}
          onSubmit={async (text) => {
            await submitComment(text, replyingTo?.id);
            setReplyingTo(null);
          }}
        />
      </div>

      <ConfirmDialog
        open={!!deletingCommentId}
        onOpenChange={(open) => {
          if (!open) setDeletingCommentId(undefined);
        }}
        title="이 댓글을 삭제할까요?"
        confirmLabel="삭제"
        tone="danger"
        onConfirm={handleDelete}
        loading={isDeleting}
      />
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
};

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
          if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); if (value.trim()) onSubmit(value.trim()); }
          if (e.key === "Escape") onCancel();
        }}
        className="w-full rounded-md bg-gray-100 px-3 py-1.5 text-[14px] text-text-primary outline-none"
      />
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onCancel} className="text-[12px] text-text-tertiary hover:text-text-secondary">
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
