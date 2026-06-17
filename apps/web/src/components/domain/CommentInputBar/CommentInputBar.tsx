'use client';

import { forwardRef, useRef, useState, type ChangeEvent } from 'react';
import Image from 'next/image';
import { Icon } from '@/components/icons';
import { cn } from '@/lib/cn';

export interface CommentInputBarProps {
  state?: 'default' | 'disabled' | 'loginRequired' | 'submitting' | 'error';
  onSubmit?: (text: string) => void | Promise<void>;
  placeholder?: string;
  initialValue?: string;
  /** controlled value — 제공 시 외부에서 input 값을 관리 */
  value?: string;
  onValueChange?: (value: string) => void;
  placement?: 'top' | 'bottom';
  variant?: 'default' | 'glass';
  className?: string;
  /** 선택된 GIF URL (미리보기용) */
  pendingGif?: string | null;
  /** GIF 제거 버튼 콜백 */
  onGifClear?: () => void;
  /** GIF 버튼 클릭 → GifPicker 열기 */
  onGifButtonClick?: () => void;
  /** 사진 버튼 클릭 → file input 트리거 */
  onPhotoButtonClick?: () => void;
  /** 사진 첨부됨 — 텍스트 없이도 등록 가능 */
  hasPendingPhoto?: boolean;
  /** 입력값 내 @멘션 토큰에 배경 하이라이트 표시 */
  highlightMentions?: boolean;
  /** 입력 최대 길이 (서버 검증과 일치시킬 것) */
  maxLength?: number;
  /** 입력창 포커스/블러 알림 (하단 탭 숨김 등에 사용) */
  onFocusChange?: (focused: boolean) => void;
}

export const CommentInputBar = forwardRef<HTMLDivElement, CommentInputBarProps>(
  function CommentInputBarCheck(
    {
      state = 'default',
      onSubmit,
      placeholder = '댓글 남기기',
      initialValue,
      value: controlledValue,
      onValueChange,
      placement = 'bottom',
      variant = 'default',
      className,
      pendingGif,
      onGifClear,
      onGifButtonClick,
      onPhotoButtonClick,
      hasPendingPhoto = false,
      highlightMentions = false,
      maxLength,
      onFocusChange,
    },
    ref,
  ) {
    const [internalValue, setInternalValue] = useState(initialValue ?? '');
    const isControlled = controlledValue !== undefined;
    const value = isControlled ? controlledValue : internalValue;
    const setValue = (v: string) => {
      if (!isControlled) setInternalValue(v);
      onValueChange?.(v);
    };
    const isSubmittingRef = useRef(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const mirrorRef = useRef<HTMLDivElement>(null);
    const syncScroll = () => {
      if (inputRef.current && mirrorRef.current) {
        mirrorRef.current.scrollLeft = inputRef.current.scrollLeft;
      }
    };
    const isTop = placement === 'top';
    const isGlass = variant === 'glass';
    const edgeBorder = isGlass
      ? isTop
        ? 'border-b border-border/40'
        : 'border-t border-border/40'
      : isTop
        ? 'border-b border-border'
        : 'border-t border-border';
    const shellClass = isGlass
      ? 'bg-transparent backdrop-blur-md'
      : 'bg-surface';
    const fieldClass = isGlass
      ? 'rounded-sm border border-white/50 bg-white shadow-xs'
      : 'rounded-sm bg-white';

    if (state === 'loginRequired') {
      return (
        <div
          ref={ref}
          className={cn(
            'flex w-full items-center justify-center gap-2 px-4 py-3 text-[14px] text-text-muted',
            shellClass,
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
      if (!trimmed && !pendingGif && !hasPendingPhoto) return;
      if (isSubmittingRef.current) return;
      isSubmittingRef.current = true;
      try {
        await onSubmit?.(trimmed);
        // 성공 시에만 입력값 초기화 — 실패 시 텍스트 유지로 재시도 가능
        setValue('');
      } finally {
        // 항상 잠금 해제 — 에러 시에도 잠금이 고착돼 새로고침해야 하던 문제 방지
        isSubmittingRef.current = false;
      }
    };

    const disabled = state === 'disabled' || state === 'submitting';

    return (
      <div
        ref={ref}
        className={cn(
          'flex w-full flex-col',
          shellClass,
          edgeBorder,
          !isTop && 'pb-[env(safe-area-inset-bottom)]',
          className,
        )}
      >
        {pendingGif ? (
          <div className="flex items-center gap-2">
            <div className="relative size-14 shrink-0 overflow-hidden rounded-sm bg-gray-100">
              <Image
                src={pendingGif}
                alt="선택된 GIF"
                fill
                unoptimized
                className="object-cover"
              />
            </div>
            <button
              type="button"
              onClick={onGifClear}
              aria-label="GIF 제거"
              className="text-text-disabled hover:text-text-muted"
            >
              <Icon name="x" size="sm" color="currentColor" decorative />
            </button>
          </div>
        ) : null}

        <div className="flex items-center gap-2">
          <div
            className={cn(
              'flex flex-1 items-center gap-1 px-3',
              fieldClass,
              state === 'error' && 'ring-2 ring-danger',
            )}
          >
            <div className="relative flex-1">
              {highlightMentions && value && (
                <div
                  ref={mirrorRef}
                  aria-hidden
                  className="pointer-events-none absolute inset-0 select-none overflow-x-hidden whitespace-pre py-3.5 text-[15px]"
                >
                  {value.split(/(@\S+)/).map((part, i) =>
                    /^@\S+/.test(part) ? (
                      <mark key={i} className="rounded-[3px] bg-pink-500/15 text-transparent">{part}</mark>
                    ) : (
                      <span key={i} className="text-transparent">{part}</span>
                    )
                  )}
                </div>
              )}
              <input
                ref={inputRef}
                type="text"
                value={value}
                maxLength={maxLength}
                disabled={disabled}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setValue(e.target.value)
                }
                onFocus={() => onFocusChange?.(true)}
                onBlur={() => onFocusChange?.(false)}
                onScroll={syncScroll}
                placeholder={placeholder}
                onKeyDown={(e) => {
                  if (
                    e.key === 'Enter' &&
                    !e.shiftKey &&
                    !e.nativeEvent.isComposing
                  ) {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSubmit();
                  }
                }}
                className="relative z-10 w-full bg-transparent py-3.5 text-[15px] text-text placeholder:text-text-disabled outline-none disabled:cursor-not-allowed"
              />
            </div>
            {onGifButtonClick ? (
              <button
                type="button"
                onClick={onGifButtonClick}
                disabled={disabled}
                aria-label="GIF 선택"
                className="shrink-0 rounded px-1.5 py-0.5 text-[11px] font-semibold text-text-disabled ring-1 ring-border hover:text-text-muted disabled:cursor-not-allowed disabled:opacity-40"
              >
                GIF
              </button>
            ) : null}
            {onPhotoButtonClick ? (
              <button
                type="button"
                onClick={onPhotoButtonClick}
                disabled={disabled}
                aria-label="사진 첨부"
                className="shrink-0 p-1 text-text-disabled hover:text-text-muted disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Icon name="images" size="sm" color="currentColor" decorative />
              </button>
            ) : null}
          </div>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={
              disabled || (!value.trim() && !pendingGif && !hasPendingPhoto)
            }
            aria-label="댓글 등록"
            className={cn(
              'inline-flex size-10 items-center justify-center rounded-full bg-primary text-text-inverse transition-opacity',
              'disabled:opacity-40 disabled:cursor-not-allowed',
            )}
          >
            {state === 'submitting' ? (
              <span className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
            ) : (
              <Icon name="send" size="sm" color="currentColor" decorative />
            )}
          </button>
        </div>
      </div>
    );
  },
);
