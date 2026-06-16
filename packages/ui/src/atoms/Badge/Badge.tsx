import { forwardRef, type HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/cn.ts";

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full type-badge whitespace-nowrap",
  {
    variants: {
      tone: {
        neutral: "",
        accent: "",
        success: "",
        warning: "",
        danger: "",
        info: "",
      },
      /** 채운 강조 스타일 (false: soft 배경) */
      solid: { true: "", false: "" },
      size: {
        sm: "h-6 px-2",
        md: "h-7 px-2.5",
      },
    },
    compoundVariants: [
      // soft (기본)
      { solid: false, tone: "neutral", class: "bg-surface-muted text-text-muted" },
      { solid: false, tone: "accent", class: "bg-accent-soft text-accent" },
      { solid: false, tone: "success", class: "bg-success-soft text-success" },
      { solid: false, tone: "warning", class: "bg-warning-soft text-warning" },
      { solid: false, tone: "danger", class: "bg-danger-soft text-danger" },
      { solid: false, tone: "info", class: "bg-info-soft text-info" },
      // solid
      { solid: true, tone: "neutral", class: "bg-surface-inverse text-text-inverse" },
      { solid: true, tone: "accent", class: "bg-accent text-text-on-accent" },
      { solid: true, tone: "success", class: "bg-success text-white" },
      { solid: true, tone: "warning", class: "bg-warning text-white" },
      { solid: true, tone: "danger", class: "bg-danger text-white" },
      { solid: true, tone: "info", class: "bg-info text-white" },
    ],
    defaultVariants: {
      tone: "neutral",
      solid: false,
      size: "md",
    },
  },
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  { className, tone, solid, size, ...props },
  ref,
) {
  return (
    <span
      ref={ref}
      className={cn(badgeVariants({ tone, solid, size }), className)}
      {...props}
    />
  );
});
