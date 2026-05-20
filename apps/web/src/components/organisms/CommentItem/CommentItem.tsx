"use client";

import { forwardRef, type ReactNode } from "react";
import { Icon } from "@/components/icons";
import { Avatar } from "@/components/primitives/Avatar";
import { IconButton } from "@/components/primitives/IconButton";
import { cn } from "@/lib/cn";

export interface CommentItemProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 표시 모드 */
  variant?: "default" | "mine" | "host" | "deleted" | "reported" | "editing";
  authorName: string;
  authorAvatarUrl?: string;
  /** 상대 시간 */
  createdAt: string;
  content: string;
  /** 더보기 버튼 콜백 */
  onMore?: () => void;
  /** Editing 모드일 때 우측 영역 (입력창 등) */
  editingSlot?: ReactNode;
}

export const CommentItem = forwardRef<HTMLDivElement, CommentItemProps>(
  function CommentItem(
    {
      className,
      variant = "default",
      authorName,
      authorAvatarUrl,
      createdAt,
      content,
      onMore,
      editingSlot,
      ...props
    },
    ref,
  ) {
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

    return (
      <div
        ref={ref}
        className={cn("flex gap-3 px-4 py-3", className)}
        {...props}
      >
        <Avatar src={authorAvatarUrl} alt={authorName} size="sm" initial={authorName?.[0]} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-[14px] font-semibold text-text-primary">{authorName}</p>
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
            <div className="mt-1.5">{editingSlot}</div>
          ) : (
            <p className="mt-0.5 whitespace-pre-wrap break-words text-[14px] text-text-primary">
              {content}
            </p>
          )}
        </div>
        {onMore ? (
          <IconButton icon="more-horizontal" variant="ghost" size="sm" aria-label="더보기" onClick={onMore} />
        ) : null}
      </div>
    );
  },
);
