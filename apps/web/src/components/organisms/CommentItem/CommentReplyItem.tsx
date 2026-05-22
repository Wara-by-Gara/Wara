"use client";

import { forwardRef } from "react";
import { Icon } from "@/components/icons";
import { Avatar } from "@/components/primitives/Avatar";
import { IconButton } from "@/components/primitives/IconButton";
import { cn } from "@/lib/cn";

export type CommentReplyVariant = "default" | "mine" | "host";

export interface CommentReplyItemProps extends React.HTMLAttributes<HTMLDivElement> {
  id?: string;
  variant?: CommentReplyVariant;
  authorName: string;
  authorAvatarUrl?: string;
  createdAt: string;
  content: string;
  /** 답글 대상 (@멘션) */
  replyToName?: string;
  onMore?: () => void;
}

export const CommentReplyItem = forwardRef<HTMLDivElement, CommentReplyItemProps>(
  function CommentReplyItem(
    {
      className,
      variant = "default",
      authorName,
      authorAvatarUrl,
      createdAt,
      content,
      replyToName,
      onMore,
      ...props
    },
    ref,
  ) {
    return (
      <div
        ref={ref}
        className={cn("flex gap-2 py-2.5", className)}
        {...props}
      >
        <Avatar
          src={authorAvatarUrl}
          alt={authorName}
          size="xs"
          initial={authorName?.[0]}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1">
            <p className="text-[13px] font-semibold text-text-primary">{authorName}</p>
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
          <p className="mt-0.5 whitespace-pre-wrap break-words text-[14px] leading-snug text-text-primary">
            {replyToName ? (
              <>
                <span className="font-semibold text-primary">@{replyToName}</span>{" "}
              </>
            ) : null}
            {content}
          </p>
        </div>
        {onMore ? (
          <IconButton
            icon="more-horizontal"
            variant="ghost"
            size="sm"
            aria-label="더보기"
            onClick={onMore}
            className="size-8 shrink-0"
          />
        ) : null}
      </div>
    );
  },
);
