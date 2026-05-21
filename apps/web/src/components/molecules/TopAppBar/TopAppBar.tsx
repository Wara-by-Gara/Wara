"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, type ReactNode } from "react";
import { Icon } from "@/components/icons";
import { IconButton } from "@/components/primitives/IconButton";
import { cn } from "@/lib/cn";

const barVariants = cva(
  "grid h-14 w-full items-center gap-2 px-4 transition-colors",
  {
    variants: {
      variant: {
        solid: "bg-surface border-b border-border",
        transparent: "bg-transparent",
        scrolled: "bg-surface border-b border-border shadow-xs",
      },
    },
    defaultVariants: { variant: "solid" },
  },
);

export interface TopAppBarProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "title">,
    VariantProps<typeof barVariants> {
  /** 좌측 — 뒤로가기 콜백 (있으면 chevron-left 아이콘 버튼 자동) */
  onBack?: () => void;
  /** 좌측 커스텀 슬롯 (onBack보다 우선) */
  leftSlot?: ReactNode;
  /** 중앙 제목 */
  title?: ReactNode;
  /** 큰 제목 모드 — 좌측 정렬, 22px */
  largeTitle?: boolean;
  /** 우측 액션 슬롯 */
  rightSlot?: ReactNode;
}

export const TopAppBar = forwardRef<HTMLElement, TopAppBarProps>(
  function TopAppBar(
    {
      className,
      variant,
      onBack,
      leftSlot,
      title,
      largeTitle,
      rightSlot,
      ...props
    },
    ref,
  ) {
    const left = leftSlot ??
      (onBack ? (
        <IconButton icon="chevron-left" aria-label="뒤로가기" onClick={onBack} variant="ghost" />
      ) : null);

    const gridCols = largeTitle
      ? "grid-cols-[auto_1fr_auto]"
      : "grid-cols-[1fr_auto_1fr]";

    return (
      <header
        ref={ref}
        className={cn(barVariants({ variant }), gridCols, className)}
        {...props}
      >
        <div className="flex min-w-0 items-center justify-start">{left}</div>
        {title ? (
          largeTitle ? (
            <h1 className="text-[22px] font-bold text-text-primary truncate text-left">
              {title}
            </h1>
          ) : (
            <h1 className="text-center text-[18px] font-bold text-text-primary truncate">
              {title}
            </h1>
          )
        ) : (
          <div />
        )}
        <div className="flex min-w-0 items-center justify-end gap-1">
          {rightSlot}
        </div>
      </header>
    );
  },
);

TopAppBar.displayName = "TopAppBar";

// Re-export Icon to allow ergonomic use in callers
export { Icon };
