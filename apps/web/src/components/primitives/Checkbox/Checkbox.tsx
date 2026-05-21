"use client";

import * as RCheckbox from "@radix-ui/react-checkbox";
import { forwardRef } from "react";
import { Icon } from "@/components/icons";
import { cn } from "@/lib/cn";

export interface CheckboxProps
  extends React.ComponentPropsWithoutRef<typeof RCheckbox.Root> {
  /** 에러 상태(빨간 테두리) */
  error?: boolean;
}

export const Checkbox = forwardRef<
  React.ComponentRef<typeof RCheckbox.Root>,
  CheckboxProps
>(function Checkbox({ className, error, ...props }, ref) {
  return (
    <RCheckbox.Root
      ref={ref}
      className={cn(
        "peer inline-flex size-5 shrink-0 items-center justify-center rounded-md border-2 bg-surface transition-colors",
        "border-border-strong hover:border-primary",
        "data-[state=checked]:border-primary data-[state=checked]:bg-primary",
        "data-[state=indeterminate]:border-primary data-[state=indeterminate]:bg-primary",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        "disabled:opacity-40 disabled:cursor-not-allowed",
        error && "border-danger data-[state=checked]:bg-danger data-[state=checked]:border-danger",
        className,
      )}
      {...props}
    >
      <RCheckbox.Indicator className="flex items-center justify-center text-text-inverse">
        <Icon name="check" size="xs" color="currentColor" decorative />
      </RCheckbox.Indicator>
    </RCheckbox.Root>
  );
});
