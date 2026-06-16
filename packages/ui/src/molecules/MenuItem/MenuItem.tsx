"use client";

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/cn.ts";
import { Icon, type IconName } from "../../icons/index.ts";
import { Badge } from "../../atoms/index.ts";

const menuItemVariants = cva(
  [
    "flex w-full min-h-[60px] items-center gap-3 px-4 py-3 text-left transition-colors",
    "focus-visible:outline-none focus-visible:[box-shadow:var(--focus-ring)]",
    "disabled:cursor-not-allowed disabled:opacity-40",
  ],
  {
    variants: {
      variant: {
        default: "text-text hover:bg-surface-muted",
        danger: "text-danger hover:bg-surface-muted",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface MenuItemProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof menuItemVariants> {
  /** 좌측 아이콘 */
  leftIcon?: IconName;
  /** 좌측 커스텀 노드 (브랜드 로고 등 — leftIcon 대신 원형 슬롯에 렌더) */
  leftSlot?: ReactNode;
  /** 우측 슬롯 (체브론/Switch/값 등) */
  rightSlot?: ReactNode;
  /** 우측 'NEW' 류 배지 */
  badge?: string;
}

export const MenuItem = forwardRef<HTMLButtonElement, MenuItemProps>(
  function MenuItem(
    { className, variant, leftIcon, leftSlot, rightSlot, badge, disabled, children, ...props },
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
        {leftSlot ?? (leftIcon ? (
          <span
            className={cn(
              "inline-flex size-9 shrink-0 items-center justify-center rounded-full",
              variant === "danger" ? "bg-danger-soft text-danger" : "bg-surface-muted text-text-muted",
            )}
          >
            <Icon name={leftIcon} size="sm" color="currentColor" decorative />
          </span>
        ) : null)}
        <span className="min-w-0 flex-1 type-body">{children}</span>
        {badge ? <Badge tone="accent" size="sm">{badge}</Badge> : null}
        {rightSlot}
      </button>
    );
  },
);
