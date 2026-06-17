"use client";

import {
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { Avatar, Icon, Spinner } from "@wara/ui";
import { cn } from "@/lib/cn";

export interface CommentBoxProps {
  /** controlled value (생략 시 내부 상태) */
  value?: string;
  onValueChange?: (value: string) => void;
  onSubmit: (text: string) => void;
  placeholder?: string;
  /** 전송 버튼 라벨 (기본 "Post") */
  submitLabel?: string;
  disabled?: boolean;
  /** 제출 중 — 전송 버튼 스피너 + 입력 잠금 */
  loading?: boolean;
  avatarUrl?: string;
  avatarName?: string;
  /** GIF 추가 (Klipy) 버튼 클릭 — 없으면 버튼 숨김 */
  onAddGif?: () => void;
  /** 사진 추가 버튼 클릭 */
  onAddPhoto?: () => void;
  /** 멘션(@) 추가 버튼 클릭 */
  onAddMention?: () => void;
  /** 첨부 미리보기(선택한 GIF/사진) — 입력 위에 표시 */
  attachment?: ReactNode;
  maxRows?: number;
  className?: string;
}

/** 입력 아래 작은 액션 버튼 (GIF/사진/멘션) */
function ActionButton({
  onClick,
  label,
  children,
}: {
  onClick?: () => void;
  label: string;
  children: ReactNode;
}) {
  if (!onClick) return null;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        "inline-flex h-8 items-center gap-1 rounded-full px-2.5 type-caption font-semibold",
        "text-text-muted transition-colors hover:bg-surface-muted hover:text-text",
        "focus-visible:outline-none focus-visible:[box-shadow:var(--focus-ring)]",
      )}
    >
      {children}
    </button>
  );
}

/**
 * 댓글 입력 — Partiful 동일 사양.
 * 1행: 아바타 + 입력 + 검은 "Post" 알약 버튼. 2행: GIF · 사진 · 멘션(@) 추가(좌측 정렬).
 * 키보드: Enter 작성 · Shift+Enter 줄바꿈 · Cmd/Ctrl+Enter 작성 · Esc 비우기.
 */
export function CommentBox({
  value,
  onValueChange,
  onSubmit,
  placeholder = "댓글을 남기거나 @로 멘션하기",
  submitLabel = "Post",
  disabled,
  loading,
  avatarUrl,
  avatarName,
  onAddGif,
  onAddPhoto,
  onAddMention,
  attachment,
  maxRows = 5,
  className,
}: CommentBoxProps) {
  const isControlled = value !== undefined;
  const [internal, setInternal] = useState("");
  const text = isControlled ? value : internal;
  const taRef = useRef<HTMLTextAreaElement>(null);
  const hasActions = Boolean(onAddGif || onAddPhoto || onAddMention);

  const setText = (v: string) => {
    if (!isControlled) setInternal(v);
    onValueChange?.(v);
  };

  const autoGrow = (el: HTMLTextAreaElement) => {
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 22 * maxRows + 16)}px`;
  };

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    autoGrow(e.target);
  };

  const submit = () => {
    const trimmed = text.trim();
    if ((!trimmed && !attachment) || disabled || loading) return;
    onSubmit(trimmed);
    setText("");
    if (taRef.current) taRef.current.style.height = "auto";
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter") {
      if (e.shiftKey) return; // 줄바꿈
      if (e.nativeEvent.isComposing) return; // 한글 IME 조합 중 — 글자 확정용 Enter
      e.preventDefault();
      submit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      setText("");
      if (taRef.current) {
        taRef.current.style.height = "auto";
        taRef.current.blur();
      }
    }
  };

  const canSend = (text.trim().length > 0 || Boolean(attachment)) && !disabled && !loading;

  return (
    <div className={cn("flex flex-col gap-2.5 border-t border-border bg-surface px-4 py-3", className)}>
      {attachment ? <div className="pl-11">{attachment}</div> : null}

      {/* 1행: 아바타 + 입력 + Post */}
      <div className="flex items-center gap-3">
        <Avatar size="sm" src={avatarUrl} name={avatarName} className="self-start" />
        <textarea
          ref={taRef}
          rows={1}
          value={text}
          disabled={disabled}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-label={placeholder}
          className="type-body max-h-[140px] flex-1 resize-none self-center bg-transparent py-1.5 text-text outline-none placeholder:text-text-muted disabled:opacity-50"
        />
        <button
          type="button"
          onClick={submit}
          disabled={!canSend}
          aria-busy={loading || undefined}
          className={cn(
            "inline-flex h-9 shrink-0 items-center justify-center gap-1.5 self-end rounded-full px-4 type-button transition-colors",
            "focus-visible:outline-none focus-visible:[box-shadow:var(--focus-ring)]",
            canSend
              ? "bg-text text-background"
              : "bg-surface-muted text-text-disabled cursor-not-allowed",
          )}
        >
          {loading ? <Spinner size="sm" /> : submitLabel}
        </button>
      </div>

      {/* 2행: GIF · 사진 · 멘션 (좌측 정렬) */}
      {hasActions ? (
        <div className="flex items-center gap-1">
          <ActionButton onClick={onAddGif} label="GIF 추가">
            <span className="rounded-[5px] border border-current px-1 text-[10px] leading-tight">GIF</span>
          </ActionButton>
          <ActionButton onClick={onAddPhoto} label="사진 추가">
            <Icon name="images" size="sm" color="currentColor" decorative />
          </ActionButton>
          <ActionButton onClick={onAddMention} label="멘션 추가">
            <span className="text-[15px] font-bold leading-none">@</span>
          </ActionButton>
        </div>
      ) : null}
    </div>
  );
}
