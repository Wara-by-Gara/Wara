"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef } from "react";
import { Icon } from "@/components/icons";
import type { IconName } from "@/components/icons";
import { cn } from "@/lib/cn";

const iconButtonVariants = cva(
  [
    "relative inline-flex items-center justify-center rounded-full",
    "transition-[color,transform,box-shadow,backdrop-filter,-webkit-backdrop-filter] select-none",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
    "disabled:opacity-40 disabled:cursor-not-allowed",
  ],
  {
    variants: {
      variant: {
        default: "bg-transparent text-text-primary hover-emphasis-sm",
        filled: "bg-primary text-text-inverse hover:bg-primary-hover",
        ghost: "bg-transparent text-text-secondary hover-emphasis-sm",
        danger: "bg-transparent text-danger hover-emphasis-sm",
      },
      size: {
        sm: "size-9",
        md: "size-11",
        lg: "size-12",
      },
      active: {
        true: "text-primary bg-primary-soft",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
      active: false,
    },
  },
);

const iconSizeMap = { sm: "sm", md: "lg", lg: "lg" } as const;

export interface IconButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children">,
    VariantProps<typeof iconButtonVariants> {
  /** 표시할 아이콘 이름 */
  icon: IconName;
  /** 스크린리더용 라벨 (필수) */
  "aria-label": string;
  /** 우측 상단 새 알림 배지 표시 */
  badge?: boolean;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton(
    { className, variant, size, active, icon, badge = false, ...props },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type="button"
        className={cn(iconButtonVariants({ variant, size, active }), className)}
        {...props}
      >
        <Icon name={icon} size={iconSizeMap[size ?? "md"]} color="currentColor" decorative />
        {badge ? (
          <span
            aria-hidden="true"
            className="absolute right-1.5 top-1.5 size-2 rounded-full bg-primary ring-2 ring-surface"
          />
        ) : null}
      </button>
    );
  },
);
