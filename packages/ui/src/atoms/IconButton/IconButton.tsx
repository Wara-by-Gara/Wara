"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/cn.ts";
import { Icon, type IconName, type IconSize } from "../../icons/index.ts";

const iconButtonVariants = cva(
  [
    "relative inline-flex items-center justify-center shrink-0 rounded-full select-none",
    "transition-[background-color,box-shadow,opacity] duration-200",
    "focus-visible:outline-none focus-visible:[box-shadow:var(--focus-ring)]",
    "disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none",
    "active:scale-[0.94]",
  ],
  {
    variants: {
      variant: {
        primary: "bg-surface-inverse text-text-inverse shadow-md hover:shadow-lg",
        secondary:
          "bg-surface-muted text-text border border-border-strong hover:bg-surface",
        glass:
          "bg-surface-glass-strong text-text border border-glass-border backdrop-blur-[var(--blur-glass)] hover:bg-surface-glass",
        ghost: "bg-transparent text-text hover:bg-surface-muted",
        danger: "bg-danger text-white hover:opacity-90",
      },
      size: {
        lg: "size-12",
        md: "size-10",
        sm: "size-9",
      },
    },
    defaultVariants: {
      variant: "ghost",
      size: "md",
    },
  },
);

const ICON_SIZE: Record<"lg" | "md" | "sm", IconSize> = {
  lg: "lg",
  md: "md",
  sm: "sm",
};

export interface IconButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "aria-label">,
    VariantProps<typeof iconButtonVariants> {
  icon: IconName;
  /** 스크린리더용 접근성 레이블 (필수) */
  label: string;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton(
    { className, variant, size = "md", icon, label, disabled, ...props },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type="button"
        className={cn(iconButtonVariants({ variant, size }), className)}
        aria-label={label}
        disabled={disabled}
        {...props}
      >
        <Icon name={icon} size={ICON_SIZE[size ?? "md"]} color="currentColor" decorative />
      </button>
    );
  },
);
