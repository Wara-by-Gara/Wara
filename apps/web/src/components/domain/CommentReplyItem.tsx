"use client";

import { forwardRef, useState, type HTMLAttributes, type ReactNode } from "react";
import Image from "next/image";
import { Heart } from "lucide-react";
import { Avatar, Icon, IconButton, Modal } from "@wara/ui";
import { cn } from "@/lib/cn";
import { renderMentions } from "./renderMentions";

export type CommentReplyVariant = "default" | "mine" | "host" | "deleted";

export interface CommentReplyItemProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "content"> {
  id?: string;
  variant?: CommentReplyVariant;
  authorName: string;
  authorInitialName?: string;
  authorHandle?: string;
  authorAvatarUrl?: string;
  createdAt: string;
  content?: string | null;
  gifUrl?: string | null;
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
  isDarkBg?: boolean;
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
      gifUrl,
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
      isDarkBg,
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
          className={cn("flex items-center gap-2 py-2 text-text-muted", className)}
          {...props}
        >
          <Icon name="trash" size="sm" color="inactive" decorative />
          <p className="type-bodySmall">삭제된 댓글입니다</p>
        </div>
      );
    }

    const handleImageClick = () => {
      if (onImageClick) onImageClick();
      else setExpandedImage(true);
    };

    return (
      <>
        <div
          ref={ref}
          className={cn("flex items-start gap-2 pb-2 pt-2.5", className)}
          {...props}
        >
          <button
            type="button"
            onClick={onAvatarClick}
            className={cn(
              "mt-0.5 shrink-0",
              onAvatarClick ? "cursor-pointer" : "cursor-default",
            )}
          >
            <Avatar
              src={authorAvatarUrl}
              alt={authorName}
              size="xs"
              name={authorInitialName ?? authorName}
            />
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1">
                <p
                  className={cn(
                    "type-bodySmall font-semibold",
                    isDarkBg ? "text-white" : "text-text",
                  )}
                >
                  {authorName}
                  {authorHandle ? (
                    <span
                      className={cn(
                        "ml-1 font-normal",
                        isDarkBg ? "text-white/60" : "text-text-muted",
                      )}
                    >
                      @{authorHandle}
                    </span>
                  ) : null}
                </p>
                {variant === "host" ? (
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-yellow-100 px-1.5 text-[10px] font-semibold text-yellow-400">
                    <Icon name="crown" size="xs" color="currentColor" decorative />
                    호스트
                  </span>
                ) : null}
                {variant === "mine" ? (
                  <span className="rounded-full bg-primary-soft px-1.5 text-[10px] font-semibold text-primary">
                    나
                  </span>
                ) : null}
                <span
                  className={cn(
                    "text-[11px]",
                    isDarkBg ? "text-white/60" : "text-text-muted",
                  )}
                >
                  · {createdAt}
                </span>
              </div>
              {imageUrl ? (
                <button
                  type="button"
                  onClick={handleImageClick}
                  className="relative size-[56px] shrink-0 overflow-hidden ring-1 ring-border"
                  aria-label="첨부 사진 확대 보기"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageUrl}
                    alt="첨부 사진"
                    className="size-full object-cover"
                  />
                  <span className="absolute inset-0 bg-transparent transition-colors hover:bg-black/10" />
                </button>
              ) : null}
            </div>
            {editingSlot ? (
              <div className="mt-1">{editingSlot}</div>
            ) : content ? (
              <p
                className={cn(
                  "mt-0.5 whitespace-pre-wrap break-words text-[14px] leading-snug",
                  isDarkBg ? "text-white" : "text-text",
                )}
              >
                {replyToName ? (
                  <>
                    <span className="font-semibold text-primary">
                      @{replyToName}
                    </span>{" "}
                  </>
                ) : null}
                {renderMentions(content, isDarkBg)}
              </p>
            ) : null}
            {!editingSlot && gifUrl ? (
              <div
                className="relative mt-1 w-[200px] overflow-hidden bg-surface-muted"
                style={{ aspectRatio: "4/3" }}
              >
                <Image
                  src={gifUrl}
                  alt="GIF"
                  fill
                  unoptimized
                  className="object-cover"
                />
              </div>
            ) : null}
            {onLike || likeCount !== undefined ? (
              <button
                type="button"
                onClick={onLike}
                className={cn(
                  "mt-1 inline-flex items-center gap-1 type-bodySmall font-semibold transition-colors",
                  liked
                    ? "text-accent"
                    : isDarkBg
                      ? "text-white/70 hover:text-accent"
                      : "text-text-muted hover:text-accent",
                )}
              >
                <Heart
                  className={cn("size-3.5 shrink-0", liked && "fill-current")}
                  aria-hidden
                />
                {likeCount ?? 0}
              </button>
            ) : null}
          </div>
          {onMore || moreMenuItems ? (
            <div className="relative shrink-0">
              <IconButton
                icon="more-horizontal"
                variant="ghost"
                size="sm"
                label="더보기"
                onClick={() => {
                  setMenuOpen((v) => !v);
                  onMore?.();
                }}
                className="size-8"
              />
              {menuOpen && moreMenuItems && (
                <div className="absolute right-0 top-8 z-10 min-w-[80px] overflow-hidden rounded-sm border border-border bg-surface shadow-md">
                  {moreMenuItems.map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      className={cn(
                        "w-full px-4 py-2 text-left type-bodySmall transition-colors hover:bg-surface-muted",
                        item.className,
                      )}
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
          <Modal
            open={expandedImage}
            onOpenChange={setExpandedImage}
            title={<span className="sr-only">사진 확대 보기</span>}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt="첨부 사진"
              className="w-full object-contain"
            />
          </Modal>
        ) : null}
      </>
    );
  },
);
