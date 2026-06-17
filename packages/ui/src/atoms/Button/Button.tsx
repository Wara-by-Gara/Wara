"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/cn.ts";

/**
 * 그라데이션 버튼(primary/oncolor) 바닥에 까는 얇은 수평 무지개 띠 (Partiful "Get started" 기준).
 * 각진 버튼 폭에 거의 꽉 차게, 바닥 가장자리에 붙어 아래로 살짝만 번지게.
 */
const UNDERGLOW =
  "after:content-[''] after:absolute after:inset-x-[3%] after:bottom-0 after:-z-10 " +
  "after:h-2 after:rounded-full after:opacity-90 after:blur-[6px] " +
  "after:[background:var(--gradient-glow)]";

const buttonVariants = cva(
  [
    "relative isolate inline-flex items-center justify-center gap-2 whitespace-nowrap select-none",
    "type-button",
    "transition-[background-color,box-shadow,transform,opacity] duration-200",
    "focus-visible:outline-none focus-visible:[box-shadow:var(--focus-ring)]",
    "disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none",
    "active:scale-[0.98]",
  ],
  {
    variants: {
      variant: {
        // 기본: 글로우 없는 잉크 버튼 (Partiful 대부분 액션 — Post/Add/Send 등)
        primary: "bg-surface-inverse text-text-inverse shadow-sm hover:shadow-md",
        // 그라데이션/사진 위 화이트 버튼
        oncolor: "bg-btn-primary-bg text-btn-primary-fg shadow-sm hover:shadow-md",
        // 보조 = 외곽선 (Partiful: Cancel/View profile/Boop)
        secondary:
          "bg-transparent text-text border border-border-strong hover:bg-surface-muted",
        glass:
          "bg-surface-glass-strong text-text border border-glass-border backdrop-blur-[var(--blur-glass)] hover:bg-surface-glass",
        ghost: "bg-transparent text-text hover:bg-surface-muted",
        danger: "bg-danger text-white hover:opacity-90",
        // 텍스트 = 블루 링크 (Partiful: Save·Poll your guests 등)
        text: "bg-transparent text-link hover:underline underline-offset-4 active:scale-100",
      },
      /** 히어로 CTA: 하단 무지개 글로우 + 각진(둥근 사각) — Get started/Sign up */
      glow: {
        true: cn("rounded-lg", UNDERGLOW),
        false: "rounded-full",
      },
      size: {
        lg: "h-[54px] px-7",
        md: "h-11 px-[22px]",
        sm: "h-9 px-4",
        xs: "h-8 px-3",
      },
      fullWidth: {
        true: "w-full",
        false: "",
      },
    },
    defaultVariants: {
      variant: "primary",
      glow: false,
      size: "md",
      fullWidth: false,
    },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Radix Slot으로 자식 요소에 props 전달 (Next.js Link 등). loading은 무시됨 */
  asChild?: boolean;
  /** 로딩 스피너 표시, true면 클릭 비활성 */
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      className,
      variant,
      glow,
      size,
      fullWidth,
      asChild = false,
      loading = false,
      disabled,
      children,
      ...props
    },
    ref,
  ) {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, glow, size, fullWidth }), className)}
        aria-busy={loading || undefined}
        disabled={disabled || loading}
        {...props}
      >
        {asChild ? (
          children
        ) : (
          <>
            {loading ? (
              <span
                className="inline-block size-4 animate-spin rounded-full border-2 border-current border-r-transparent"
                aria-hidden="true"
              />
            ) : null}
            {children}
          </>
        )}
      </Comp>
    );
  },
);
