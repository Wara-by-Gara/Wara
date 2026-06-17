"use client";

import { forwardRef, useState, type HTMLAttributes, type ReactNode } from "react";
import Image from "next/image";
import { Heart } from "lucide-react";
import { Avatar, Icon, IconButton, Modal } from "@wara/ui";
import { cn } from "@/lib/cn";
import { CommentReplyItem, type CommentReplyItemProps } from "./CommentReplyItem";
import { renderMentions } from "./renderMentions";

export interface CommentItemProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "content"> {
  variant?: "default" | "mine" | "host" | "deleted" | "reported" | "editing";
  authorName: string;
  /** 아바타 이니셜 계산용 실명 (미제공 시 authorName 사용) */
  authorInitialName?: string;
  authorHandle?: string;
  authorAvatarUrl?: string;
  createdAt: string;
  content?: string | null;
  gifUrl?: string | null;
  imageUrl?: string;
  onImageClick?: () => void;
  replies?: CommentReplyItemProps[];
  onReply?: () => void;
  onMore?: () => void;
  /** 더보기 메뉴 아이템 */
  moreMenuItems?: Array<{ label: string; onClick: () => void; className?: string }>;
  editingSlot?: ReactNode;
  likeCount?: number;
  liked?: boolean;
  onLike?: () => void;
  onAvatarClick?: () => void;
  isDarkBg?: boolean;
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
      gifUrl,
      imageUrl,
      onImageClick,
      replies,
      onReply,
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
          className={cn(
            "flex items-center gap-2 px-4 py-3 text-text-muted",
            className,
          )}
          {...props}
        >
          <Icon name="trash" size="sm" color="inactive" decorative />
          <p className="type-bodySmall">삭제된 댓글입니다</p>
        </div>
      );
    }

    if (variant === "reported") {
      return (
        <div
          ref={ref}
          className={cn(
            "flex items-center gap-2 px-4 py-3 text-text-muted",
            className,
          )}
          {...props}
        >
          <Icon name="flag" size="sm" color="inactive" decorative />
          <p className="type-bodySmall">신고된 댓글입니다</p>
        </div>
      );
    }

    const hasReplies = replies && replies.length > 0;

    const handleImageClick = () => {
      if (onImageClick) onImageClick();
      else setExpandedImage(true);
    };

    return (
      <div ref={ref} className={cn("px-4 py-2", className)} {...props}>
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={onAvatarClick}
            className={onAvatarClick ? "cursor-pointer" : "cursor-default"}
          >
            <Avatar
              src={authorAvatarUrl}
              alt={authorName}
              size="sm"
              name={authorInitialName ?? authorName}
            />
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <p
                    className={cn(
                      "text-[14px] font-semibold",
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
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-yellow-100 px-1.5 text-[11px] font-semibold text-yellow-400">
                      <Icon name="crown" size="xs" color="currentColor" decorative />{" "}
                      호스트
                    </span>
                  ) : null}
                  {variant === "mine" ? (
                    <span className="rounded-full bg-primary-soft px-1.5 text-[11px] font-semibold text-primary">
                      나
                    </span>
                  ) : null}
                  <span
                    className={cn(
                      "text-[12px]",
                      isDarkBg ? "text-white/60" : "text-text-muted",
                    )}
                  >
                    · {createdAt}
                  </span>
                </div>
                {variant === "editing" && editingSlot ? (
                  <div className="mt-1">{editingSlot}</div>
                ) : (
                  <>
                    {content ? (
                      <p
                        className={cn(
                          "mt-0.5 whitespace-pre-wrap break-words text-[14px]",
                          isDarkBg ? "text-white" : "text-text",
                        )}
                      >
                        {renderMentions(content, isDarkBg)}
                      </p>
                    ) : null}
                    {gifUrl ? (
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
                  </>
                )}
                <div className="mt-1 flex items-center gap-3">
                  {onReply ? (
                    <button
                      type="button"
                      onClick={onReply}
                      className={cn(
                        "type-bodySmall font-semibold transition-colors hover:text-primary",
                        isDarkBg ? "text-white/70" : "text-text-muted",
                      )}
                    >
                      답글 달기
                    </button>
                  ) : null}
                  {likeCount !== undefined ? (
                    onLike ? (
                      <button
                        type="button"
                        onClick={onLike}
                        className={cn(
                          "inline-flex items-center gap-1 type-bodySmall font-semibold transition-colors",
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
                        {likeCount}
                      </button>
                    ) : (
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 type-bodySmall font-semibold",
                          liked
                            ? "text-accent"
                            : isDarkBg
                              ? "text-white/70"
                              : "text-text-muted",
                        )}
                      >
                        <Heart
                          className={cn("size-3.5 shrink-0", liked && "fill-current")}
                          aria-hidden
                        />
                        {likeCount}
                      </span>
                    )
                  ) : null}
                </div>
              </div>
              {imageUrl ? (
                <button
                  type="button"
                  onClick={handleImageClick}
                  className="relative size-[52px] shrink-0 overflow-hidden ring-1 ring-border"
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
          </div>

          {/* ... 버튼 + 드롭다운 */}
          {onMore || moreMenuItems ? (
            <div className="relative">
              <IconButton
                icon="more-horizontal"
                variant="ghost"
                size="sm"
                label="더보기"
                className={cn(isDarkBg && "text-white")}
                onClick={() => {
                  setMenuOpen((v) => !v);
                  onMore?.();
                }}
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

        {hasReplies ? (
          <div
            className="ml-11 mt-1.5 space-y-0.5 border-l-2 border-primary-soft pl-3"
            role="group"
            aria-label={`${authorName}님 댓글의 답글`}
          >
            {replies.map((reply) => (
              <CommentReplyItem
                key={reply.id ?? `${reply.authorName}-${reply.createdAt}`}
                {...reply}
                isDarkBg={isDarkBg}
              />
            ))}
          </div>
        ) : null}
      </div>
    );
  },
);
