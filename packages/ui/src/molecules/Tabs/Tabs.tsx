"use client";

import { useRef, type KeyboardEvent } from "react";
import { cva } from "class-variance-authority";
import { cn } from "../../lib/cn.ts";

export interface TabItem {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface TabsProps {
  items: TabItem[];
  value: string;
  onValueChange: (value: string) => void;
  /** underline: 하단 인디케이터 / segment: 알약형 세그먼트 */
  variant?: "underline" | "segment";
  fullWidth?: boolean;
  /** tablist 접근성 레이블 */
  "aria-label"?: string;
  className?: string;
}

const listVariants = cva("flex", {
  variants: {
    variant: {
      underline: "gap-1 border-b border-border",
      segment: "gap-1 rounded-full bg-surface-muted p-1",
    },
    fullWidth: { true: "w-full", false: "" },
  },
  defaultVariants: { variant: "underline", fullWidth: false },
});

const tabVariants = cva(
  [
    "type-button inline-flex items-center justify-center whitespace-nowrap transition-colors",
    "focus-visible:outline-none focus-visible:[box-shadow:var(--focus-ring)]",
    "disabled:opacity-40 disabled:pointer-events-none",
  ],
  {
    variants: {
      variant: {
        underline: "h-11 px-3 -mb-px border-b-2",
        segment: "h-9 px-4 rounded-full",
      },
      active: { true: "", false: "" },
      fullWidth: { true: "flex-1", false: "" },
    },
    compoundVariants: [
      { variant: "underline", active: true, class: "border-text text-text" },
      {
        variant: "underline",
        active: false,
        class: "border-transparent text-text-muted hover:text-text",
      },
      { variant: "segment", active: true, class: "bg-surface text-text shadow-sm" },
      { variant: "segment", active: false, class: "text-text-muted hover:text-text" },
    ],
    defaultVariants: { variant: "underline", active: false, fullWidth: false },
  },
);

export function Tabs({
  items,
  value,
  onValueChange,
  variant = "underline",
  fullWidth = false,
  "aria-label": ariaLabel,
  className,
}: TabsProps) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const move = (e: KeyboardEvent, from: number) => {
    const enabled = items
      .map((it, i) => ({ it, i }))
      .filter(({ it }) => !it.disabled);
    if (enabled.length === 0) return;
    const pos = enabled.findIndex(({ i }) => i === from);
    let next = pos;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (pos + 1) % enabled.length;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (pos - 1 + enabled.length) % enabled.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = enabled.length - 1;
    else return;
    e.preventDefault();
    const target = enabled[next]!;
    onValueChange(target.it.value);
    refs.current[target.i]?.focus();
  };

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      aria-orientation="horizontal"
      className={cn(listVariants({ variant, fullWidth }), className)}
    >
      {items.map((item, i) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            role="tab"
            type="button"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            disabled={item.disabled}
            onClick={() => onValueChange(item.value)}
            onKeyDown={(e) => move(e, i)}
            className={cn(tabVariants({ variant, active, fullWidth }))}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
