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
      ? 'rounded-sm border border-white/50 bg-white/45 shadow-xs backdrop-blur-md'
      : 'rounded-sm bg-border';

    if (state === 'loginRequired') {
      return (
        <div
          ref={ref}
          className={cn(
            'flex w-full items-center justify-center gap-2 px-4 py-3 text-[14px] text-text-secondary',
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
      setValue('');
      await onSubmit?.(trimmed);
      isSubmittingRef.current = false;
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
              className="text-text-tertiary hover:text-text-secondary"
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
            <input
              type="text"
              value={value}
              disabled={disabled}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setValue(e.target.value)
              }
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
              className="flex-1 bg-transparent py-2.5 text-[15px] text-text-primary placeholder:text-text-tertiary outline-none disabled:cursor-not-allowed"
            />
            {onGifButtonClick ? (
              <button
                type="button"
                onClick={onGifButtonClick}
                disabled={disabled}
                aria-label="GIF 선택"
                className="shrink-0 rounded px-1.5 py-0.5 text-[11px] font-semibold text-text-tertiary ring-1 ring-border hover:text-text-secondary disabled:cursor-not-allowed disabled:opacity-40"
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
                className="shrink-0 p-1 text-text-tertiary hover:text-text-secondary disabled:cursor-not-allowed disabled:opacity-40"
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
