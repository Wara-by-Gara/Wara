"use client";

import { forwardRef, useState } from "react";
import { cn } from "@/lib/cn";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** 에러 메시지 (있으면 빨간 테두리) */
  error?: string;
  /** 최대 글자 수 표시 */
  maxLength?: number;
  /** 글자 수 카운터 표시 */
  showCounter?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea(
    {
      className,
      error,
      maxLength,
      showCounter,
      defaultValue = "",
      value,
      onChange,
      disabled,
      rows = 4,
      ...props
    },
    ref,
  ) {
    const isControlled = value !== undefined;
    const [uncontrolledLength, setUncontrolledLength] = useState(
      String(defaultValue).length,
    );
    const length = isControlled ? String(value).length : uncontrolledLength;

    return (
      <div className="w-full">
        <textarea
          ref={ref}
          rows={rows}
          maxLength={maxLength}
          disabled={disabled}
          aria-invalid={!!error}
          onChange={(e) => {
            if (!isControlled) setUncontrolledLength(e.target.value.length);
            onChange?.(e);
          }}
          {...(isControlled ? { value } : { defaultValue })}
          className={cn(
            "w-full rounded-sm border bg-surface p-4 text-[16px] text-text-primary placeholder:text-text-tertiary transition-colors resize-y",
            "outline-none focus:border-primary focus:ring-2 focus:ring-primary/20",
            "disabled:bg-background-soft disabled:cursor-not-allowed",
            error
              ? "border-danger focus:border-danger focus:ring-danger/20"
              : "border-border-strong",
            className,
          )}
          {...props}
        />
        {(showCounter || maxLength) && !error ? (
          <div className="mt-1.5 text-right text-[13px] text-text-tertiary">
            {length}
            {maxLength ? ` / ${maxLength}` : ""}
          </div>
        ) : null}
      </div>
    );
  },
);
