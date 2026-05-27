"use client";

import { forwardRef, useRef, useState, type ChangeEvent } from "react";
import { Icon } from "@/components/icons";
import { Avatar } from "@/components/primitives/Avatar";
import { cn } from "@/lib/cn";

export interface CommentInputBarProps {
  avatarUrl?: string;
  authorName?: string;
  state?: "default" | "disabled" | "loginRequired" | "submitting" | "error";
  onSubmit?: (text: string) => void | Promise<void>;
  placeholder?: string;
  initialValue?: string;
  placement?: "top" | "bottom";
  className?: string;
}

export const CommentInputBar = forwardRef<HTMLDivElement, CommentInputBarProps>(
  function CommentInputBar(
    {
      avatarUrl,
      authorName,
      state = "default",
      onSubmit,
      placeholder = "댓글 남기기",
      initialValue,
      placement = "bottom",
      className,
    },
    ref,
  ) {
    const [value, setValue] = useState(initialValue ?? "");
    const isSubmittingRef = useRef(false); // ← 핵심
    const isTop = placement === "top";
    const edgeBorder = isTop ? "border-b border-border" : "border-t border-border";

    if (state === "loginRequired") {
      return (
        <div
          ref={ref}
          className={cn(
            "flex w-full items-center justify-center gap-2 bg-surface px-4 py-3 text-[14px] text-text-secondary",
            edgeBorder,
            className,
          )}
        >
          <Icon name="lock" size="sm" color="inactive" decorative />
          로그인하면 댓글을 남길 수 있어요
        </div>
      );
    }

const handleSubmit = async () => {
  const trimmed = value.trim();
  if (!trimmed) return;
  if (isSubmittingRef.current) return;
  isSubmittingRef.current = true;
  setValue("");
  await onSubmit?.(trimmed);
  isSubmittingRef.current = false;
};

    const disabled = state === "disabled" || state === "submitting";

    return (
      <div
        ref={ref}
        className={cn(
          "flex w-full items-center gap-2 bg-surface px-3 py-2",
          edgeBorder,
          !isTop && "pb-[calc(env(safe-area-inset-bottom)+8px)]",
          className,
        )}
      >
        <Avatar src={avatarUrl} alt={authorName ?? ""} size="sm" initial={authorName?.[0]} />
        <div
          className={cn(
            "flex flex-1 items-center gap-2 rounded-full bg-gray-100 px-4",
            state === "error" && "ring-2 ring-danger",
          )}
        >
          <input
            type="text"
            value={value}
            disabled={disabled}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setValue(e.target.value)}
            placeholder={placeholder}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                e.stopPropagation();
                handleSubmit();
              }
            }}
            className="flex-1 bg-transparent py-2.5 text-[15px] text-text-primary placeholder:text-text-tertiary outline-none disabled:cursor-not-allowed"
          />
        </div>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={disabled || !value.trim()}
          aria-label="댓글 등록"
          className={cn(
            "inline-flex size-10 items-center justify-center rounded-full bg-primary text-text-inverse transition-opacity",
            "disabled:opacity-40 disabled:cursor-not-allowed",
          )}
        >
          {state === "submitting" ? (
            <span className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
          ) : (
            <Icon name="send" size="sm" color="currentColor" decorative />
          )}
        </button>
      </div>
    );
  },
);