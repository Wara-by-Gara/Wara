"use client";

import {
  forwardRef,
  useEffect,
  useState,
  type HTMLAttributes,
} from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/cn.ts";
import { Spinner } from "../../atoms/index.ts";

export interface LoadingStateProps extends HTMLAttributes<HTMLDivElement> {
  /** 스피너 아래 안내 문구 */
  label?: string;
  /** 표시 전 지연(ms) — 짧은 로딩의 스피너 깜빡임 방지 (StyleSeed: 300ms 권장). 기본 0 */
  delay?: number;
}

/** 중앙 스피너 + 안내 문구 (영역 로딩) */
export function LoadingState({
  className,
  label,
  delay = 0,
  ...props
}: LoadingStateProps) {
  const [shown, setShown] = useState(delay === 0);
  useEffect(() => {
    if (delay === 0) return;
    const t = setTimeout(() => setShown(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  if (!shown) return null;

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
