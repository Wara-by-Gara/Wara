import type { HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/cn.ts";

const spinnerVariants = cva(
  "inline-block animate-spin rounded-full border-current border-r-transparent align-[-0.125em]",
  {
    variants: {
      size: {
        sm: "size-4 border-2",
        md: "size-6 border-2",
        lg: "size-8 border-[3px]",
      },
    },
    defaultVariants: { size: "md" },
  },
);

export interface SpinnerProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof spinnerVariants> {
  /** 스크린리더용 레이블 */
  label?: string;
}

export function Spinner({
  className,
  size,
  label = "불러오는 중",
  ...props
}: SpinnerProps) {
  return (
    <span role="status" aria-live="polite" {...props}>
      <span className={cn(spinnerVariants({ size }), className)} aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </span>
  );
}
