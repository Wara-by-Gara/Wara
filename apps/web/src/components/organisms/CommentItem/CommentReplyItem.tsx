"use client";

import { forwardRef, useState, type ReactNode } from "react";
import { Icon } from "@/components/icons";
import { Avatar } from "@/components/primitives/Avatar";
import { IconButton } from "@/components/primitives/IconButton";
import { Modal, ModalOverlay, ModalPrimitive } from "@/components/molecules/Modal";
import { cn } from "@/lib/cn";
import { renderMentions } from "./renderMentions";

export type CommentReplyVariant = "default" | "mine" | "host" | "deleted";

export interface CommentReplyItemProps extends React.HTMLAttributes<HTMLDivElement> {
  id?: string;
  variant?: CommentReplyVariant;
  authorName: string;
  authorInitialName?: string;
  authorHandle?: string;
  authorAvatarUrl?: string;
  createdAt: string;
  content: string;
  /** 답글 대상 (@멘션) */
  replyToName?: string;
  /** 사진 첨부 URL */
  imageUrl?: string;
  /** 사진 클릭 콜백 (미제공 시 내장 확대 뷰어 사용) */
  onImageClick?: () => void;
  onMore?: () => void;
  moreMenuItems?: Array<{ label: string; onClick: () => void; className?: string }>;
  editingSlot?: ReactNode;
  likeCount?: number;
  liked?: boolean;
  onLike?: () => void;
  onAvatarClick?: () => void;
}

export const CommentReplyItem = forwardRef<HTMLDivElement, CommentReplyItemProps>(
  function CommentReplyItem(
    {
      className,
      variant = "default",
      authorName,
      authorHandle,
      authorInitialName,
      authorAvatarUrl,
      createdAt,
      content,
      replyToName,
      imageUrl,
      onImageClick,
      onMore,
      moreMenuItems,
      editingSlot,
      likeCount,
      liked,
      onLike,
      onAvatarClick,
      ...props
    },
    ref,
  ) {
    const [expandedImage, setExpandedImage] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);

    if (variant === "deleted") {
      return (
        <div ref={ref} className={cn("flex items-center gap-2 py-2 text-text-tertiary", className)} {...props}>
          <Icon name="trash" size="sm" color="inactive" decorative />
          <p className="text-[13px]">삭제된 댓글입니다</p>
        </div>
      );
    }

    const handleImageClick = () => {
      if (onImageClick) {
        onImageClick();
      } else {
        setExpandedImage(true);
      }
    };

    return (
      <>
        <div
          ref={ref}
          className={cn("flex gap-2 py-2.5", className)}
          {...props}
        >
          <button type="button" onClick={onAvatarClick} className={onAvatarClick ? "cursor-pointer" : "cursor-default"}>
            <Avatar
              src={authorAvatarUrl}
              alt={authorName}
              size="xs"
              name={authorInitialName ?? authorName}
            />
          </button>
          <div className="min-w-0 flex-1">
            {/* 이름행 + 사진 썸네일을 같은 높이에 배치 */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1">
                <p className="text-[13px] font-semibold text-text-primary">
                  {authorName}
                  {authorHandle ? (
                    <span className="ml-1 font-normal text-text-tertiary">@{authorHandle}</span>
                  ) : null}
                </p>
                {variant === "host" ? (
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-yellow-100 px-1.5 text-[10px] font-bold text-yellow-400">
                    <Icon name="crown" size="xs" color="currentColor" decorative />
                    호스트
                  </span>
                ) : null}
                {variant === "mine" ? (
                  <span className="rounded-full bg-primary-soft px-1.5 text-[10px] font-bold text-primary">
                    나
                  </span>
                ) : null}
                <span className="text-[11px] text-text-tertiary">· {createdAt}</span>
              </div>
              {imageUrl ? (
                <button
                  type="button"
                  onClick={handleImageClick}
                  className="relative shrink-0 size-[56px] overflow-hidden rounded-lg ring-1 ring-border"
                  aria-label="첨부 사진 확대 보기"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imageUrl} alt="첨부 사진" className="size-full object-cover" />
                  <span className="absolute inset-0 bg-black/0 transition-colors hover:bg-black/15" />
                </button>
              ) : null}
            </div>
            {editingSlot ? (
              <div className="mt-1">{editingSlot}</div>
            ) : content ? (
              <p className="mt-0.5 whitespace-pre-wrap break-words text-[14px] leading-snug text-text-primary">
                {replyToName ? (
                  <>
                    <span className="font-semibold text-primary">@{replyToName}</span>{" "}
                  </>
                ) : null}
                {renderMentions(content)}
              </p>
            ) : null}
            {(onLike || likeCount !== undefined) ? (
              <button
                type="button"
                onClick={onLike}
                className={cn(
                  "mt-1 text-[13px] font-semibold transition-colors",
                  liked ? "text-primary" : "text-text-tertiary hover:text-primary",
                )}
              >
                ♥ {likeCount ?? 0}
              </button>
            ) : null}
          </div>
          {(onMore || moreMenuItems) ? (
            <div className="relative shrink-0">
              <IconButton
                icon="more-horizontal"
                variant="ghost"
                size="sm"
                aria-label="더보기"
                onClick={() => {
                  setMenuOpen((v) => !v);
                  onMore?.();
                }}
                className="size-8"
              />
              {menuOpen && moreMenuItems && (
                <div className="absolute right-0 top-8 z-10 min-w-[80px] rounded-xl border border-border bg-surface shadow-md">
                  {moreMenuItems.map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      className={cn("w-full px-4 py-2 text-left text-[13px] hover:bg-surface-hover", item.className)}
                      onClick={() => {
                        item.onClick();
                        setMenuOpen(false);
                      }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* 사진 확대 뷰어 */}
        {imageUrl && !onImageClick ? (
          <Modal open={expandedImage} onOpenChange={setExpandedImage}>
            <ModalOverlay className="fixed inset-0 z-50 bg-black/80" />
            <ModalPrimitive.Content
              className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-32px)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl focus:outline-none"
              aria-describedby={undefined}
            >
              <ModalPrimitive.Title className="sr-only">사진 확대 보기</ModalPrimitive.Title>
              <button
                type="button"
                onClick={() => setExpandedImage(false)}
                aria-label="닫기"
                className="absolute right-2 top-2 z-10 inline-flex size-8 items-center justify-center rounded-full bg-black/50 text-white"
              >
                <Icon name="x" size="sm" color="currentColor" decorative />
              </button>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl} alt="첨부 사진" className="w-full object-contain" />
            </ModalPrimitive.Content>
          </Modal>
        ) : null}
      </>
    );
  },
);
