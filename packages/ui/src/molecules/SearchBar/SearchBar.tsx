"use client";

import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "../../lib/cn.ts";
import { Icon } from "../../icons/index.ts";

export interface SearchBarProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  /** 입력값이 있을 때 X(지우기) 버튼 표시 — 클릭 시 호출 */
  onClear?: () => void;
  /** 우측 "취소" 텍스트 버튼 */
  showCancel?: boolean;
  onCancel?: () => void;
  /** 우측 추가 슬롯 (필터 버튼 등) */
  rightSlot?: ReactNode;
}

export const SearchBar = forwardRef<HTMLInputElement, SearchBarProps>(
  function SearchBar(
    { className, onClear, showCancel, onCancel, rightSlot, disabled, value, ...props },
    ref,
  ) {
    const hasValue = typeof value === "string" ? value.length > 0 : value != null;
    return (
      <div className="flex items-center gap-2">
        <div
          className={cn(
            "flex h-11 flex-1 items-center gap-2 rounded-full border border-border-strong bg-surface px-4",
            disabled && "opacity-40",
            className,
          )}
        >
          <Icon name="search" size="sm" color="muted" decorative />
          <input
            ref={ref}
            type="search"
            disabled={disabled}
            value={value}
            className="type-body flex-1 bg-transparent text-text outline-none placeholder:text-text-disabled [&::-webkit-search-cancel-button]:hidden"
            {...props}
          />
          {hasValue && onClear ? (
            <button
              type="button"
              aria-label="지우기"
              onClick={onClear}
              className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-surface-muted text-text-muted hover:text-text"
            >
              <Icon name="close" size="xs" decorative />
            </button>
          ) : null}
          {rightSlot}
        </div>
        {showCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="type-button shrink-0 px-2 py-1.5 text-primary"
          >
            취소
          </button>
        ) : null}
      </div>
    );
  },
);
