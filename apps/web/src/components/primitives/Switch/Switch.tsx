"use client";

import * as RSwitch from "@radix-ui/react-switch";
import { forwardRef } from "react";
import { cn } from "@/lib/cn";

export interface SwitchProps
  extends React.ComponentPropsWithoutRef<typeof RSwitch.Root> {
  /** 로딩 중 표시 (사용자 입력 비활성) */
  loading?: boolean;
}

export const Switch = forwardRef<
  React.ComponentRef<typeof RSwitch.Root>,
  SwitchProps
>(function Switch({ className, loading, disabled, ...props }, ref) {
  return (
    <RSwitch.Root
      ref={ref}
      disabled={loading || disabled}
      aria-busy={loading || undefined}
      className={cn(
        "relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors",
        "bg-gray-300 data-[state=checked]:bg-primary",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        "disabled:opacity-40 disabled:cursor-not-allowed",
        className,
      )}
      {...props}
    >
      <RSwitch.Thumb
        className={cn(
          "pointer-events-none inline-block size-5 rounded-full bg-surface shadow-sm ring-0 transition-transform",
          "translate-x-0.5 data-[state=checked]:translate-x-[22px]",
        )}
      />
    </RSwitch.Root>
  );
});
