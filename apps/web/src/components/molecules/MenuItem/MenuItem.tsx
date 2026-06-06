"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, type ReactNode } from "react";
import { Icon } from "@/components/icons";
import type { IconName } from "@/components/icons";
import { Badge } from "@/components/primitives/Badge";
import { cn } from "@/lib/cn";

const menuItemVariants = cva(
  [
    "flex w-full min-h-[64px] items-center gap-3 rounded-none px-4 py-3 text-left",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
    "disabled:opacity-40 disabled:cursor-not-allowed",
  ],
  {
    variants: {
      variant: {
        default: "text-text-primary hover:bg-gray-50 transition-colors duration-150",
        danger: "text-danger hover:bg-gray-50 transition-colors duration-150",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface MenuItemProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof menuItemVariants> {
  /** 좌측 아이콘 */
  leftIcon?: IconName;
  /** 우측 슬롯 (배지/체브론/toggle 등) */
  rightSlot?: ReactNode;
  /** 우측 'NEW' 류 배지 */
  badge?: string;
}

export const MenuItem = forwardRef<HTMLButtonElement, MenuItemProps>(
  function MenuItem(
    {
      className,
      variant,
      leftIcon,
      rightSlot,
      badge,
      disabled,
      children,
      ...props
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type="button"
        disabled={disabled}
        className={cn(menuItemVariants({ variant }), className)}
        {...props}
      >
        {leftIcon ? (
          <span
            className={cn(
              "relative inline-flex size-10 shrink-0 items-center justify-center rounded-full",
              variant === "danger" ? "bg-red-50 text-danger" : "bg-gray-100 text-gray-700",
            )}
          >
            <Icon
              name={leftIcon}
              size="md"
              color="currentColor"
              decorative
            />
          </span>
        ) : null}
        <span className="flex-1 text-[15px] font-semibold leading-snug">{children}</span>
        {badge ? <Badge variant="new" size="sm">{badge}</Badge> : null}
        {rightSlot}
      </button>
    );
  },
);
