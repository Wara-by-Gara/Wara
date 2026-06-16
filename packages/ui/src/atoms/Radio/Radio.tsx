"use client";

import * as RRadio from "@radix-ui/react-radio-group";
import { forwardRef, type ComponentPropsWithoutRef, type ComponentRef } from "react";
import { cn } from "../../lib/cn.ts";

export const RadioGroup = forwardRef<
  ComponentRef<typeof RRadio.Root>,
  ComponentPropsWithoutRef<typeof RRadio.Root>
>(function RadioGroup({ className, ...props }, ref) {
  return (
    <RRadio.Root ref={ref} className={cn("flex flex-col gap-3", className)} {...props} />
  );
});

export type RadioProps = ComponentPropsWithoutRef<typeof RRadio.Item>;

/** 선택 시 잉크(검정/라이트) 강조. */
export const Radio = forwardRef<ComponentRef<typeof RRadio.Item>, RadioProps>(
  function Radio({ className, ...props }, ref) {
    return (
      <RRadio.Item
        ref={ref}
        className={cn(
          "inline-flex size-5 shrink-0 items-center justify-center rounded-full border-2 bg-surface transition-colors",
          "border-border-strong hover:border-text",
          "data-[state=checked]:border-text",
          "focus-visible:outline-none focus-visible:[box-shadow:var(--focus-ring)]",
          "disabled:cursor-not-allowed disabled:opacity-40",
          className,
        )}
        {...props}
      >
        <RRadio.Indicator className="block size-2.5 rounded-full bg-text" />
      </RRadio.Item>
    );
  },
);
