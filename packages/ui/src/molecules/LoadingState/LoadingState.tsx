import { forwardRef, type HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/cn.ts";
import { Spinner } from "../../atoms/index.ts";

export interface LoadingStateProps extends HTMLAttributes<HTMLDivElement> {
  /** 스피너 아래 안내 문구 */
  label?: string;
}

/** 중앙 스피너 + 안내 문구 (영역 로딩) */
export function LoadingState({ className, label, ...props }: LoadingStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 px-4 py-12 text-text-muted",
        className,
      )}
      {...props}
    >
      <Spinner size="lg" label={label ?? "불러오는 중"} />
      {label ? <p className="type-bodySmall">{label}</p> : null}
    </div>
  );
}

const skeletonVariants = cva("animate-pulse bg-surface-muted", {
  variants: {
    radius: {
      sm: "rounded-xs",
      md: "rounded-sm",
      lg: "rounded-md",
      xl: "rounded-lg",
      full: "rounded-full",
    },
  },
  defaultVariants: { radius: "md" },
});

export interface SkeletonProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof skeletonVariants> {}

/** 콘텐츠 자리표시 placeholder */
export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  function Skeleton({ className, radius, ...props }, ref) {
    return (
      <div
        ref={ref}
        aria-hidden="true"
        className={cn(skeletonVariants({ radius }), className)}
        {...props}
      />
    );
  },
);
