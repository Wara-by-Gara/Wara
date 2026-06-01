"use client";

import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef } from "react";
import { cn } from "@/lib/cn";

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 font-bold whitespace-nowrap",
    "transition-[color,transform,box-shadow,backdrop-filter,-webkit-backdrop-filter] select-none",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
    "disabled:opacity-40 disabled:cursor-not-allowed",
  ],
  {
    variants: {
      variant: {
        primary: "bg-primary text-text-inverse hover:bg-primary-hover active:bg-primary-hover",
        secondary: "bg-primary-soft text-primary hover-emphasis-sm",
        outline:
          "border border-border-strong bg-surface text-text-primary hover-emphasis-sm",
        ghost: "bg-transparent text-text-primary hover-emphasis-sm",
        text: "bg-transparent text-primary underline-offset-4 hover:underline px-1",
        danger: "bg-danger text-text-inverse hover:bg-red-600 active:bg-red-600",
      },
      size: {
        lg: "h-14 px-6 rounded-[18px] text-base",
        md: "h-12 px-5 rounded-2xl text-[15px]",
        sm: "h-9 px-4 rounded-full text-[13px]",
      },
      fullWidth: {
        true: "w-full",
        false: "",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
      fullWidth: false,
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Radix Slot으로 자식 요소에 props 전달 (Next.js Link 등) */
  asChild?: boolean;
  /** 로딩 스피너 표시, true면 클릭 비활성 */
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      className,
      variant,
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
        className={cn(buttonVariants({ variant, size, fullWidth }), className)}
        aria-busy={loading || undefined}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <span
            className="inline-block size-4 animate-spin rounded-full border-2 border-current border-r-transparent"
            aria-hidden="true"
          />
        ) : null}
        {children}
      </Comp>
    );
  },
);
