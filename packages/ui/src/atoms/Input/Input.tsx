"use client";

import { forwardRef, type InputHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/cn.ts";

const inputVariants = cva(
  [
    "w-full rounded-md border bg-surface text-text placeholder:text-text-disabled",
    "transition-colors outline-none",
    "focus:[box-shadow:var(--focus-ring)] focus:border-text",
    "disabled:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-60",
  ],
  {
    variants: {
      size: {
        sm: "h-9 px-3 type-bodySmall",
        md: "h-11 px-3.5 type-body",
        lg: "h-[54px] px-4 type-bodyLarge",
      },
      invalid: {
        true: "border-danger focus:border-danger",
        false: "border-border-strong",
      },
    },
    defaultVariants: {
      size: "md",
      invalid: false,
    },
  },
);

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "size">,
    Pick<VariantProps<typeof inputVariants>, "size"> {
  /** 에러 상태 (빨간 테두리 + aria-invalid) */
  invalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, size, invalid = false, disabled, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      disabled={disabled}
      aria-invalid={invalid || undefined}
      className={cn(inputVariants({ size, invalid }), className)}
      {...props}
    />
  );
});
