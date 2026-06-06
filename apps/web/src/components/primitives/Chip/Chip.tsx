"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef } from "react";
import { Icon } from "@/components/icons";
import { cn } from "@/lib/cn";

const chipVariants = cva(
  [
    "inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-[13px] font-medium",
    "transition-colors border select-none",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
  ],
  {
    variants: {
      variant: {
        selectable: "border-border bg-surface text-text-primary hover:bg-gray-100 transition-colors duration-150",
        filter: "border-border bg-surface text-text-secondary hover:bg-gray-100 transition-colors duration-150",
        category: "border-transparent bg-gray-100 text-text-primary",
        status: "border-transparent bg-primary-soft text-primary",
        removable: "border-border bg-surface text-text-primary",
      },
      selected: {
        true: "border-primary bg-primary-soft text-primary",
        false: "",
      },
      disabled: {
        true: "opacity-40 pointer-events-none",
        false: "",
      },
    },
    defaultVariants: {
      variant: "selectable",
      selected: false,
      disabled: false,
    },
  },
);

export interface ChipProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "disabled">,
    VariantProps<typeof chipVariants> {
  /** 우측 X 버튼 표시. 클릭 시 onRemove 콜백 호출 */
  onRemove?: () => void;
}

export const Chip = forwardRef<HTMLButtonElement, ChipProps>(function Chip(
  { className, variant, selected, disabled, onRemove, children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      className={cn(chipVariants({ variant, selected, disabled }), className)}
      aria-pressed={variant === "selectable" || variant === "filter" ? !!selected : undefined}
      disabled={!!disabled}
      {...props}
    >
      {children}
      {onRemove ? (
        <span
          role="button"
          tabIndex={-1}
          aria-label="제거"
          className="-mr-1 inline-flex size-4 items-center justify-center rounded-full hover:bg-gray-100 transition-colors duration-150"
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
