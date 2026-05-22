"use client";

import { TopAppBar } from "@/components/molecules/TopAppBar";
import { ConfirmModal } from "@/components/molecules/Modal";
import { CommentItem } from "@/components/organisms/CommentItem";
import { CommentInputBar } from "@/components/organisms/CommentInputBar";
import { CommentListSkeleton } from "@/components/organisms/Skeleton";
import { EmptyState } from "@/components/organisms/EmptyState";
import { ErrorState } from "@/components/organisms/ErrorState";
import { mockComments, mockMe, type MockComment } from "@/lib/mockData";
import { mobileMainCenter, mobileMainScroll } from "@/lib/mobilePageLayout";
import { cn } from "@/lib/cn";

export type CommentsState =
  | "empty"
  | "list"
  | "loading"
  | "error"
  | "moreLoading"
  | "keyboardOpen"
  | "loginRequired"
  | "disabledByHost"
  | "deleteModal"
  | "reportModal";

export interface CommentsProps {
  state?: CommentsState;
  comments?: MockComment[];
  onBack?: () => void;
}

export const Comments = ({ state = "list", comments = mockComments, onBack }: CommentsProps) => {
  const mainCentered = state === "error" || state === "empty";

  const commentInput =
    state === "disabledByHost" ? (
      <p className="border-t border-border bg-surface px-5 py-4 text-center text-[13px] text-text-tertiary">
        호스트가 댓글을 받지 않고 있어요
      </p>
    ) : state === "loginRequired" ? (
      <CommentInputBar state="loginRequired" />
    ) : (
      <CommentInputBar
        avatarUrl={mockMe.avatarUrl}
        authorName={mockMe.nickname}
        state={state === "keyboardOpen" ? "default" : "default"}
      />
    );

  return (
    <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col overflow-x-hidden bg-background">
      <TopAppBar className="shrink-0" title={`댓글 ${comments.length}`} onBack={onBack ?? (() => {})} />

      <main className={cn(mainCentered ? mobileMainCenter : mobileMainScroll)}>
        {state === "loading" ? (
          <div className="px-2 py-2"><CommentListSkeleton /></div>
        ) : state === "error" ? (
          <ErrorState title="댓글을 불러오지 못했어요" onRetry={() => {}} />
        ) : state === "empty" ? (
          <EmptyState icon="message-circle" title="댓글이 아직 없어요" description="첫 댓글을 남겨보세요" />
        ) : (
          <div className="divide-y divide-border">
            {comments.map((c) => (
              <CommentItem
                key={c.id}
                variant={c.variant}
                authorName={c.authorName}
                authorAvatarUrl={c.authorAvatarUrl}
                createdAt={c.createdAt}
                content={c.content}
                replies={c.replies}
                onReply={() => {}}
                onMore={() => {}}
              />
            ))}
            {state === "moreLoading" ? (
              <div className="flex justify-center py-4">
                <span className="size-5 animate-spin rounded-full border-2 border-primary border-r-transparent" />
              </div>
            ) : null}
          </div>
        )}
      </main>

      <div className="shrink-0">{commentInput}</div>

      <ConfirmModal contained
        open={state === "deleteModal"}
        onOpenChange={() => {}}
        title="이 댓글을 삭제할까요?"
        confirmLabel="삭제"
        confirmVariant="danger"
      />
      <ConfirmModal contained
        open={state === "reportModal"}
        onOpenChange={() => {}}
        title="이 댓글을 신고할까요?"
        description="검토 후 적절한 조치를 취해드릴게요"
        confirmLabel="신고"
        confirmVariant="danger"
      />
    </div>
  );
};
