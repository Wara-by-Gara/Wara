"use client";

import * as RRadio from "@radix-ui/react-radio-group";
import { forwardRef } from "react";
import { cn } from "@/lib/cn";

export const RadioGroup = forwardRef<
  React.ComponentRef<typeof RRadio.Root>,
  React.ComponentPropsWithoutRef<typeof RRadio.Root>
>(function RadioGroup({ className, ...props }, ref) {
  return (
    <RRadio.Root
      ref={ref}
      className={cn("flex flex-col gap-3", className)}
      {...props}
    />
  );
});

export type RadioProps = React.ComponentPropsWithoutRef<typeof RRadio.Item>;

export const Radio = forwardRef<
  React.ComponentRef<typeof RRadio.Item>,
  RadioProps
>(function Radio({ className, ...props }, ref) {
  return (
    <RRadio.Item
      ref={ref}
      className={cn(
        "inline-flex size-5 shrink-0 items-center justify-center rounded-full border-2 bg-surface transition-colors",
        "border-border-strong hover:border-primary",
        "data-[state=checked]:border-primary",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        "disabled:opacity-40 disabled:cursor-not-allowed",
        className,
      )}
      {...props}
    >
      <RRadio.Indicator className="block size-2.5 rounded-full bg-primary" />
    </RRadio.Item>
  );
});
