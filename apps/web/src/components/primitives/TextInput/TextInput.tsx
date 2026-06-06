"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, useId, useState, type ReactNode } from "react";
import { Icon } from "@/components/icons";
import type { IconName } from "@/components/icons";
import { cn } from "@/lib/cn";

const wrapperVariants = cva(
  [
    "flex items-center gap-2 w-full h-[52px] rounded-xs border bg-surface transition-colors px-4",
    "focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20",
  ],
  {
    variants: {
      state: {
        default: "border-border-strong",
        error: "border-danger focus-within:border-danger focus-within:ring-danger/20",
        success: "border-success",
        disabled: "border-border bg-background-soft cursor-not-allowed",
      },
    },
    defaultVariants: { state: "default" },
  },
);

export interface TextInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof wrapperVariants> {
  /** 좌측 아이콘 */
  leftIcon?: IconName;
  /** 우측 아이콘 또는 슬롯 */
  rightSlot?: ReactNode;
  /** 에러 메시지 — 있으면 state=error로 강제 */
  error?: string;
  /** 성공 표시 */
  success?: boolean;
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  function TextInput(
    {
      className,
      leftIcon,
      rightSlot,
      error,
      success,
      disabled,
      type = "text",
      state,
      ...props
    },
    ref,
  ) {
    const resolvedState = error
      ? "error"
      : disabled
        ? "disabled"
        : success
          ? "success"
          : (state ?? "default");
    return (
      <div className={cn(wrapperVariants({ state: resolvedState }), className)}>
        {leftIcon ? (
          <Icon name={leftIcon} size="md" color="currentColor" decorative className="text-text-tertiary" />
        ) : null}
        <input
          ref={ref}
          type={type}
          disabled={disabled}
          aria-invalid={!!error}
          className="flex-1 bg-transparent text-[16px] text-text-primary placeholder:text-text-tertiary outline-none disabled:cursor-not-allowed"
          {...props}
        />
        {rightSlot}
      </div>
    );
  },
);

export type PasswordInputProps = Omit<TextInputProps, "type" | "rightSlot">;

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  function PasswordInput(props, ref) {
    const [show, setShow] = useState(false);
    const id = useId();
    return (
      <TextInput
        ref={ref}
        id={props.id ?? id}
        type={show ? "text" : "password"}
        rightSlot={
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            aria-label={show ? "비밀번호 숨기기" : "비밀번호 보기"}
            aria-pressed={show}
            className="inline-flex size-8 items-center justify-center rounded-full text-text-tertiary hover:bg-gray-100 transition-colors duration-150"
          >
            <Icon name={show ? "eye-off" : "eye"} size="sm" color="currentColor" decorative />
          </button>
        }
        {...props}
      />
    );
  },
);
