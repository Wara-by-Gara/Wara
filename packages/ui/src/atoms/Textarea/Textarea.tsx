"use client";

import { forwardRef, useState, type TextareaHTMLAttributes } from "react";
import { cn } from "../../lib/cn.ts";

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** 에러 상태 (빨간 테두리 + aria-invalid) */
  invalid?: boolean;
  /** 글자 수 카운터 표시 */
  showCounter?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea(
    {
      className,
      invalid = false,
      showCounter = false,
      maxLength,
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
          aria-invalid={invalid || undefined}
          onChange={(e) => {
            if (!isControlled) setUncontrolledLength(e.target.value.length);
            onChange?.(e);
          }}
          {...(isControlled ? { value } : { defaultValue })}
          className={cn(
            "type-body w-full resize-y rounded-md border bg-surface p-4 text-text placeholder:text-text-disabled",
            "outline-none transition-colors",
            "focus:[box-shadow:var(--focus-ring)] focus:border-text",
            "disabled:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-60",
            invalid ? "border-danger focus:border-danger" : "border-border-strong",
            className,
          )}
          {...props}
        />
        {showCounter || maxLength ? (
          <div className="type-caption mt-1.5 text-right text-text-muted">
            {length}
            {maxLength ? ` / ${maxLength}` : ""}
          </div>
        ) : null}
      </div>
    );
  },
);
