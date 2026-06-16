"use client";

import * as RCheckbox from "@radix-ui/react-checkbox";
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ComponentRef,
} from "react";
import { Icon } from "../../icons/index.ts";
import { cn } from "../../lib/cn.ts";

export interface CheckboxProps
  extends ComponentPropsWithoutRef<typeof RCheckbox.Root> {
  /** 에러 상태(빨간 테두리) */
  error?: boolean;
}

/** 선택 시 잉크(검정/라이트) 강조 — Partiful 라이트 기준. */
export const Checkbox = forwardRef<
  ComponentRef<typeof RCheckbox.Root>,
  CheckboxProps
>(function Checkbox({ className, error, ...props }, ref) {
  return (
    <RCheckbox.Root
      ref={ref}
      className={cn(
        "peer inline-flex size-5 shrink-0 items-center justify-center rounded-xs border-2 bg-surface transition-colors",
        "border-border-strong hover:border-text",
        "data-[state=checked]:border-text data-[state=checked]:bg-text",
        "data-[state=indeterminate]:border-text data-[state=indeterminate]:bg-text",
        "focus-visible:outline-none focus-visible:[box-shadow:var(--focus-ring)]",
        "disabled:cursor-not-allowed disabled:opacity-40",
        error &&
          "border-danger data-[state=checked]:border-danger data-[state=checked]:bg-danger",
        className,
      )}
      {...props}
    >
      <RCheckbox.Indicator className="flex items-center justify-center text-background">
        <Icon name="check" size="xs" color="currentColor" decorative />
      </RCheckbox.Indicator>
    </RCheckbox.Root>
  );
});
