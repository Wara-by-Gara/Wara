import { forwardRef, type HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/cn.ts";

const dividerVariants = cva("shrink-0 border-0", {
  variants: {
    orientation: {
      horizontal: "w-full",
      vertical: "h-full self-stretch",
    },
    strength: {
      soft: "",
      strong: "",
    },
  },
  compoundVariants: [
    { orientation: "horizontal", strength: "soft", class: "h-px bg-border" },
    { orientation: "horizontal", strength: "strong", class: "h-px bg-border-strong" },
    { orientation: "vertical", strength: "soft", class: "w-px bg-border" },
    { orientation: "vertical", strength: "strong", class: "w-px bg-border-strong" },
  ],
  defaultVariants: {
    orientation: "horizontal",
    strength: "soft",
  },
});

export interface DividerProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof dividerVariants> {}

export const Divider = forwardRef<HTMLDivElement, DividerProps>(function Divider(
  { className, orientation, strength, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      role="separator"
      aria-orientation={orientation === "vertical" ? "vertical" : "horizontal"}
      className={cn(dividerVariants({ orientation, strength }), className)}
      {...props}
    />
  );
});
