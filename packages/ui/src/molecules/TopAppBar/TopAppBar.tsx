"use client";

import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/cn.ts";
import { IconButton } from "../../atoms/index.ts";

const barVariants = cva(
  "grid min-h-[56px] w-full items-center gap-2 px-4 transition-colors",
  {
    variants: {
      variant: {
        solid: "bg-surface border-b border-border",
        transparent: "bg-transparent",
        glass:
          "bg-surface-glass-strong border-b border-glass-border backdrop-blur-[var(--blur-glass)]",
      },
    },
    defaultVariants: { variant: "solid" },
  },
);

export interface TopAppBarProps
  extends Omit<HTMLAttributes<HTMLElement>, "title">,
    VariantProps<typeof barVariants> {
  /** 뒤로가기 콜백 (있으면 chevron-left 버튼 자동) */
  onBack?: () => void;
  /** 좌측 커스텀 슬롯 (onBack보다 우선) */
  leftSlot?: ReactNode;
  title?: ReactNode;
  /** 큰 제목 모드 — 좌측 정렬 */
  largeTitle?: boolean;
  /** 우측 액션 슬롯 */
  rightSlot?: ReactNode;
}

export const TopAppBar = forwardRef<HTMLElement, TopAppBarProps>(
  function TopAppBar(
    { className, variant, onBack, leftSlot, title, largeTitle, rightSlot, ...props },
    ref,
  ) {
    const left =
      leftSlot ??
      (onBack ? (
        <IconButton icon="chevron-left" label="뒤로가기" onClick={onBack} />
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
          <h1
            className={cn(
              "truncate text-text",
              largeTitle ? "type-sectionTitle text-left" : "type-cardTitle text-center",
            )}
          >
            {title}
          </h1>
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
