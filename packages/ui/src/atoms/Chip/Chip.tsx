"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/cn.ts";
import { Icon } from "../../icons/index.ts";

const chipVariants = cva(
  [
    "inline-flex items-center gap-1.5 h-8 px-3 rounded-full type-bodySmall font-medium",
    "border select-none transition-colors",
    "focus-visible:outline-none focus-visible:[box-shadow:var(--focus-ring)]",
  ],
  {
    variants: {
      selected: {
        // Partiful: 선택 칩은 중립(잉크) 강조 — 핑크 아님
        true: "border-text bg-surface-muted text-text font-semibold",
        false: "border-border bg-surface text-text-muted hover:bg-surface-muted",
      },
      disabled: {
        true: "opacity-40 pointer-events-none",
        false: "",
      },
    },
    defaultVariants: {
      selected: false,
      disabled: false,
    },
  },
);

export interface ChipProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "disabled">,
    VariantProps<typeof chipVariants> {
  /** 우측 X 버튼 표시 — 클릭 시 onRemove 호출 */
  onRemove?: () => void;
}

export const Chip = forwardRef<HTMLButtonElement, ChipProps>(function Chip(
  { className, selected, disabled, onRemove, children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      className={cn(chipVariants({ selected, disabled }), className)}
      aria-pressed={selected ?? undefined}
      disabled={!!disabled}
      {...props}
    >
      {children}
      {onRemove ? (
        <span
          role="button"
          tabIndex={-1}
          aria-label="제거"
          className="-mr-1 inline-flex size-4 items-center justify-center rounded-full transition-colors hover:bg-surface-muted"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        >
          <Icon name="x" size="xs" decorative />
        </span>
      ) : null}
    </button>
  );
});
