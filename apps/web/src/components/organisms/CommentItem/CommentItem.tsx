"use client";

import { forwardRef, useState, type ReactNode } from "react";
import { Icon } from "@/components/icons";
import { Avatar } from "@/components/primitives/Avatar";
import { IconButton } from "@/components/primitives/IconButton";
import { Modal, ModalOverlay, ModalPrimitive } from "@/components/molecules/Modal";
import { cn } from "@/lib/cn";
import { CommentReplyItem, type CommentReplyItemProps } from "./CommentReplyItem";

export interface CommentItemProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "mine" | "host" | "deleted" | "reported" | "editing";
  authorName: string;
  /** 아바타 이니셜 계산용 실명 (미제공 시 authorName 사용) */
  authorInitialName?: string;
  authorHandle?: string;
  authorAvatarUrl?: string;
  createdAt: string;
  content: string;
  imageUrl?: string;
  onImageClick?: () => void;
  replies?: CommentReplyItemProps[];
  onReply?: () => void;
  onMore?: () => void;
  /** 더보기 메뉴 아이템 */
  moreMenuItems?: Array<{ label: string; onClick: () => void; className?: string }>;
  editingSlot?: ReactNode;
}

export const CommentItem = forwardRef<HTMLDivElement, CommentItemProps>(
  function CommentItem(
    {
      className,
      variant = "default",
      authorName,
      authorInitialName,
      authorHandle,
      authorAvatarUrl,
      createdAt,
      content,
      imageUrl,
      onImageClick,
      replies,
      onReply,
      onMore,
      moreMenuItems,
      editingSlot,
      ...props
    },
    ref,
  ) {
    const [expandedImage, setExpandedImage] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);

    if (variant === "deleted") {
      return (
        <div
          ref={ref}
          className={cn("flex items-center gap-2 px-4 py-3 text-text-tertiary", className)}
          {...props}
        >
          <Icon name="trash" size="sm" color="inactive" decorative />
          <p className="text-[13px]">삭제된 댓글입니다</p>
        </div>
      );
    }

    if (variant === "reported") {
      return (
        <div
          ref={ref}
          className={cn("flex items-center gap-2 px-4 py-3 text-text-tertiary", className)}
          {...props}
        >
          <Icon name="flag" size="sm" color="inactive" decorative />
          <p className="text-[13px]">신고된 댓글입니다</p>
        </div>
      );
    }

    const hasReplies = replies && replies.length > 0;

    const handleImageClick = () => {
      if (onImageClick) {
        onImageClick();
      } else {
        setExpandedImage(true);
      }
    };

    return (
      <div ref={ref} className={cn("px-4 py-2", className)} {...props}>
        <div className="flex items-start gap-3">
          <Avatar src={authorAvatarUrl} alt={authorName} size="sm" name={authorInitialName ?? authorName} />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <p className="text-[14px] font-semibold text-text-primary">
                    {authorName}
                    {authorHandle ? (
                      <span className="ml-1 font-normal text-text-tertiary">@{authorHandle}</span>
                    ) : null}
                  </p>
                  {variant === "host" ? (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-yellow-100 px-1.5 text-[11px] font-bold text-yellow-400">
                      <Icon name="crown" size="xs" color="currentColor" decorative /> 호스트
                    </span>
                  ) : null}
                  {variant === "mine" ? (
                    <span className="rounded-full bg-primary-soft px-1.5 text-[11px] font-bold text-primary">나</span>
                  ) : null}
                  <span className="text-[12px] text-text-tertiary">· {createdAt}</span>
                </div>
                {variant === "editing" && editingSlot ? (
                  <div className="mt-1">{editingSlot}</div>
                ) : (
                  <>
                    {content ? (
                      <p className="mt-0.5 whitespace-pre-wrap break-words text-[14px] text-text-primary">
                        {content}
                      </p>
                    ) : null}
                  </>
                )}
                {onReply ? (
                  <button
                    type="button"
                    onClick={onReply}
                    className="mt-1 text-[13px] font-semibold text-text-tertiary transition-colors hover:text-primary"
                  >
                    답글 달기
                  </button>
                ) : null}
              </div>
              {imageUrl ? (
                <button
                  type="button"
                  onClick={handleImageClick}
                  className="relative shrink-0 size-[52px] overflow-hidden rounded-xl ring-1 ring-border"
                  aria-label="첨부 사진 확대 보기"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imageUrl} alt="첨부 사진" className="size-full object-cover" />
                  <span className="absolute inset-0 bg-black/0 transition-colors hover:bg-black/15" />
                </button>
              ) : null}
            </div>
          </div>

          {/* ... 버튼 + 드롭다운 */}
          {(onMore || moreMenuItems) ? (
            <div className="relative">
              <IconButton
                icon="more-horizontal"
                variant="ghost"
                size="sm"
                aria-label="더보기"
                onClick={() => {
                  setMenuOpen((v) => !v);
                  onMore?.();
                }}
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

        {hasReplies ? (
          <div
            className="mt-1.5 ml-11 space-y-0.5 border-l-2 border-primary-soft pl-3"
            role="group"
            aria-label={`${authorName}님 댓글의 답글`}
          >
            {replies.map((reply) => (
              <CommentReplyItem key={reply.id ?? `${reply.authorName}-${reply.createdAt}`} {...reply} />
            ))}
          </div>
        ) : null}
      </div>
    );
  },
);