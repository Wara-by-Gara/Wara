"use client";

import { forwardRef, type ReactNode } from "react";
import { Icon } from "@/components/icons";
import { cn } from "@/lib/cn";

export interface SearchBarProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  /** 우측에 취소 버튼 표시 */
  showCancel?: boolean;
  /** 취소 버튼 클릭 핸들러 */
  onCancel?: () => void;
  /** 우측 추가 슬롯 (필터 버튼 등) */
  rightSlot?: ReactNode;
}

export const SearchBar = forwardRef<HTMLInputElement, SearchBarProps>(
  function SearchBar(
    { className, showCancel, onCancel, rightSlot, disabled, ...props },
    ref,
  ) {
    return (
      <div className="flex items-center gap-2">
        <div
          className={cn(
            "flex flex-1 items-center gap-2 rounded-full bg-surface px-4 h-11",
            "focus-within:bg-surface focus-within:ring-2 focus-within:ring-primary",
            disabled && "opacity-40",
            className,
          )}
        >
          <Icon name="search" size="sm" color="inactive" decorative />
          <input
            ref={ref}
            type="search"
            disabled={disabled}
            className="flex-1 bg-transparent text-[15px] text-text-primary placeholder:text-text-tertiary outline-none"
            {...props}
          />
          {rightSlot}
        </div>
        {showCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="text-[14px] font-medium text-primary px-2 py-1.5"
          >
            취소
          </button>
        ) : null}
      </div>
    );
  },
);
