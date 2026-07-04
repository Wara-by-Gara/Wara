"use client";

import * as RSwitch from "@radix-ui/react-switch";
import { forwardRef, type ComponentPropsWithoutRef, type ComponentRef } from "react";
import { cn } from "../../lib/cn.ts";

export interface SwitchProps
  extends ComponentPropsWithoutRef<typeof RSwitch.Root> {
  /** 로딩 중 (입력 비활성) */
  loading?: boolean;
}

/** iOS식 토글 — ON 시 systemGreen 채움 (모바일 네이티브 Switch 미러). */
export const Switch = forwardRef<ComponentRef<typeof RSwitch.Root>, SwitchProps>(
  function Switch({ className, loading, disabled, ...props }, ref) {
    return (
      <RSwitch.Root
        ref={ref}
        disabled={loading || disabled}
        aria-busy={loading || undefined}
        className={cn(
          "relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors",
          "bg-border-strong data-[state=checked]:bg-ios-green",
          "focus-visible:outline-none focus-visible:[box-shadow:var(--focus-ring)]",
          "disabled:cursor-not-allowed disabled:opacity-40",
          className,
        )}
        {...props}
      >
        <RSwitch.Thumb className="pointer-events-none inline-block size-5 translate-x-0.5 rounded-full bg-surface shadow-sm ring-0 transition-transform data-[state=checked]:translate-x-[22px]" />
      </RSwitch.Root>
    );
  },
);
