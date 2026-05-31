"use client";

import { forwardRef, type ReactNode } from "react";
import { Icon } from "@/components/icons";
import { CommentInputBar } from "@/components/organisms/CommentInputBar";
import { CommentItem, type CommentReplyItemProps } from "@/components/organisms/CommentItem";
import {
  Modal,
  ModalPortal,
  ModalPrimitive,
} from "@/components/molecules/Modal";
import { Avatar } from "@/components/primitives/Avatar";
import { IconButton } from "@/components/primitives/IconButton";
import { cn } from "@/lib/cn";

export interface PhotoViewerComment {
  id: string;
  authorName: string;
  authorAvatarUrl?: string;
  content?: string | null;
  createdAt: string;
  variant?: "default" | "mine" | "host" | "deleted" | "reported";
  moreMenuItems?: Array<{ label: string; onClick: () => void; className?: string }>;
  editingSlot?: React.ReactNode;
  onReply?: () => void;
  replies?: CommentReplyItemProps[];
  likeCount?: number;
  liked?: boolean;
  onLike?: () => void;
  gifUrl?: string | null;
}

export interface PhotoViewerProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  authorName?: string;
  authorAvatarUrl?: string;
  createdAt?: string;
  /** 보기 모드 */
  variant?: "default" | "owner" | "host" | "loading" | "error";
  /** 모달 열림 (지정 시 모달로 표시) */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Storybook 베젤 등 부모 영역 안에 모달을 맞출 때 */
  contained?: boolean;
  onClose?: () => void;
  onSave?: () => void;
  onShare?: () => void;
  onMore?: () => void;
  /** 좋아요 */
  likeCount?: number;
  liked?: boolean;
  onLike?: () => void;
  isLiking?: boolean;
  /** 댓글 */
  commentCount?: number;
  commentsOpen?: boolean;
  onCommentsOpenChange?: (open: boolean) => void;
  comments?: PhotoViewerComment[];
  onCommentSubmit?: (text: string) => void;
  commentPlaceholder?: string;
  /** 답글 대상 표시 배너 (CommentInputBar 위에 렌더링) */
  replyBanner?: ReactNode;
  /** 멘션 드롭다운 (replyBanner 위에 렌더링) */
  mentionDropdown?: ReactNode;
  /** 댓글 입력 controlled value */
  inputValue?: string;
  onInputValueChange?: (v: string) => void;
  /** GIF 관련 */
  pendingGif?: string | null;
  onGifClear?: () => void;
  onGifButtonClick?: () => void;
  /** GIF picker 슬롯 (mentionDropdown 위에 렌더링) */
  gifPicker?: ReactNode;
  /** 추가 액션 슬롯 */
  rightActions?: ReactNode;
}

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(n);
}

function ProfileActions({
  authorName,
  authorAvatarUrl,
  createdAt,
  likeCount,
  liked,
  onLike,
  isLiking,
  commentCount,
  commentsOpen,
  onCommentsOpenChange,
}: Pick<
  PhotoViewerProps,
  | "authorName"
  | "authorAvatarUrl"
  | "createdAt"
  | "likeCount"
  | "liked"
  | "onLike"
  | "isLiking"
  | "commentCount"
  | "commentsOpen"
  | "onCommentsOpenChange"
>) {
  const actions = (
    <div className="flex shrink-0 items-center gap-4">
      <button
        type="button"
        onClick={onLike}
        disabled={isLiking}
        aria-label={liked ? "좋아요 취소" : "좋아요"}
        className="inline-flex items-center gap-1.5 text-white disabled:opacity-60"
      >
        <Icon
          name="heart"
          size="lg"
          color="currentColor"
          decorative
          className={cn(liked && "fill-primary text-primary")}
        />
        <span className="text-[14px] font-semibold tabular-nums">{formatCount(likeCount ?? 0)}</span>
      </button>
      <button
        type="button"
        onClick={() => onCommentsOpenChange?.(!commentsOpen)}
        aria-label={commentsOpen ? "댓글 접기" : "댓글 보기"}
        aria-expanded={commentsOpen}
        className={cn(
          "inline-flex items-center gap-1.5",
          commentsOpen ? "text-primary" : "text-white/90",
        )}
      >
        <Icon name="message-circle" size="lg" color="currentColor" decorative />
        <span className="text-[14px] font-semibold tabular-nums">
          {formatCount(commentCount ?? 0)}
        </span>
      </button>
    </div>
  );

  if (!authorName) {
    return <div className="flex items-center justify-end px-4 py-2.5">{actions}</div>;
  }

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2.5">
      <div className="flex min-w-0 items-center gap-2">
        <Avatar src={authorAvatarUrl} alt={authorName} size="sm" initial={authorName?.[0]} />
        <div className="min-w-0 flex flex-col">
          <span className="truncate text-[14px] font-semibold">{authorName}</span>
          {createdAt ? <span className="text-[12px] opacity-80">{createdAt}</span> : null}
        </div>
      </div>
      {actions}
    </div>
  );
}

const PhotoViewerBody = forwardRef<HTMLDivElement, PhotoViewerProps>(
  function PhotoViewerBody(
    {
      className,
      src,
      alt,
      authorName,
      authorAvatarUrl,
      createdAt,
      variant = "default",
      onClose,
      onSave,
      onShare,
      onMore,
      likeCount = 0,
      liked = false,
      onLike,
      isLiking = false,
      commentCount = 0,
      commentsOpen = false,
      onCommentsOpenChange,
      comments = [],
      onCommentSubmit,
      commentPlaceholder = "댓글 남기기",
      replyBanner,
      mentionDropdown,
      inputValue,
      onInputValueChange,
      pendingGif,
      onGifClear,
      onGifButtonClick,
      gifPicker,
      rightActions,
      ...props
    },
    ref,
  ) {
    return (
      <div
        ref={ref}
        className={cn(
          "relative flex min-h-0 flex-1 flex-col overflow-hidden bg-black text-text-inverse",
          className,
        )}
        {...props}
      >
        <header className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-2 py-2">
          <IconButton
            icon="x"
            variant="ghost"
            aria-label="닫기"
            onClick={onClose}
            className="bg-black/40 text-white hover:bg-black/60"
          />
          <div className="flex items-center gap-1">
            {onSave ? (
              <IconButton
                icon="download"
                variant="ghost"
                aria-label="저장"
                onClick={onSave}
                className="text-white"
              />
            ) : null}
            {onShare ? (
              <IconButton
                icon="share"
                variant="ghost"
                aria-label="공유"
                onClick={onShare}
                className="text-white"
              />
            ) : null}
            {(variant === "owner" || variant === "host") && onMore ? (
              <IconButton
                icon="more-horizontal"
                variant="ghost"
                aria-label="더보기"
                onClick={onMore}
                className="text-white"
              />
            ) : null}
            {rightActions}
          </div>
        </header>

        <main
          className={cn(
            "relative z-0 flex min-h-0 flex-1 items-center justify-center px-2",
            commentsOpen ? "pt-10 pb-0" : "pt-10 pb-1",
          )}
        >
          {variant === "loading" ? (
            <span className="size-8 animate-spin rounded-full border-2 border-current border-r-transparent" />
          ) : variant === "error" ? (
            <div className="flex flex-col items-center justify-center gap-2 text-center">
              <Icon name="alert-triangle" size="xl" color="currentColor" decorative />
              <p className="text-sm">사진을 불러오지 못했어요</p>
            </div>
          ) : src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt={alt ?? ""}
              className="max-h-full max-w-full object-contain"
            />
          ) : null}
        </main>

        <footer className="relative z-10 shrink-0 border-t border-white/10 bg-black">
          <ProfileActions
            authorName={authorName}
            authorAvatarUrl={authorAvatarUrl}
            createdAt={createdAt}
            likeCount={likeCount}
            liked={liked}
            onLike={onLike}
            isLiking={isLiking}
            commentCount={commentCount}
            commentsOpen={commentsOpen}
            onCommentsOpenChange={onCommentsOpenChange}
          />

          {commentsOpen ? (
            <>
              <div className="max-h-[132px] overflow-y-auto overscroll-contain border-t border-white/10 bg-black/80">
                {comments.length > 0 ? (
                  <ul className="divide-y divide-white/10">
                    {comments.map((c) => (
                      <li key={c.id}>
                        <CommentItem
                          variant={c.editingSlot ? "editing" : c.variant}
                          authorName={c.authorName}
                          authorAvatarUrl={c.authorAvatarUrl}
                          createdAt={c.createdAt}
                          content={c.content}
                          gifUrl={c.gifUrl ?? undefined}
                          moreMenuItems={c.moreMenuItems}
                          editingSlot={c.editingSlot}
                          onReply={c.onReply}
                          replies={c.replies}
                          likeCount={c.likeCount}
                          liked={c.liked}
                          onLike={c.onLike}
                          className="bg-transparent py-2.5 [&_p]:text-text-inverse [&_span:not(.mention-highlight)]:text-white/70"
                        />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="px-4 py-6 text-center text-[13px] text-white/60">
                    아직 댓글이 없어요
                  </p>
                )}
              </div>
              {gifPicker}
              {mentionDropdown}
              {replyBanner}
              <CommentInputBar
                placeholder={commentPlaceholder}
                onSubmit={onCommentSubmit}
                value={inputValue}
                onValueChange={onInputValueChange}
                pendingGif={pendingGif}
                onGifClear={onGifClear}
                onGifButtonClick={onGifButtonClick}
                className="border-white/15 bg-black/50 [&_input]:text-white [&_input]:placeholder:text-white/50"
              />
            </>
          ) : null}
        </footer>
      </div>
    );
  },
);

export const PhotoViewer = forwardRef<HTMLDivElement, PhotoViewerProps>(
  function PhotoViewer(
    {
      open,
      onOpenChange,
      contained = false,
      onClose,
      className,
      ...props
    },
    ref,
  ) {
    const handleClose = () => {
      onClose?.();
      onOpenChange?.(false);
    };

    const body = (
      <PhotoViewerBody
        ref={ref}
        className={cn(open !== undefined && "h-full min-h-0", className)}
        onClose={handleClose}
        {...props}
      />
    );

    if (open === undefined) {
      return (
        <div
          className={cn(
            "relative flex aspect-[9/16] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-black text-text-inverse",
            className,
          )}
        >
          <PhotoViewerBody ref={ref} onClose={onClose} {...props} />
        </div>
      );
    }

    const contentClass = cn(
      "z-50 flex h-[min(520px,72%)] max-h-[72%] w-[calc(100%-32px)] max-w-md flex-col overflow-hidden rounded-3xl bg-black p-0 shadow-lg focus:outline-none",
      "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
      "data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-95",
      contained ? "absolute" : "fixed",
    );

    const modalBody = (
      <>
<ModalPrimitive.Content className={contentClass} aria-describedby={undefined}>
  <ModalPrimitive.Title className="sr-only">사진 뷰어</ModalPrimitive.Title>
  {body}
</ModalPrimitive.Content>
      </>
    );

    return (
      <Modal open={open} onOpenChange={onOpenChange}>
        {contained ? modalBody : <ModalPortal>{modalBody}</ModalPortal>}
      </Modal>
    );
  },
);
