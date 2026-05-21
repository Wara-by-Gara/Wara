"use client";

import { forwardRef, type ReactNode } from "react";
import { Icon } from "@/components/icons";
import type { IconName } from "@/components/icons";
import { Button } from "@/components/primitives/Button";
import { cn } from "@/lib/cn";

export interface ErrorStateProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 좌측 상단 아이콘 (기본 alert-triangle) */
  icon?: IconName;
  title: string;
  description?: ReactNode;
  /** 다시 시도 콜백. 있으면 Retry 버튼 자동 렌더 */
  onRetry?: () => void;
  /** Retry 버튼 라벨 (기본 '다시 시도') */
  retryLabel?: string;
}

export const ErrorState = forwardRef<HTMLDivElement, ErrorStateProps>(
  function ErrorState(
    { className, icon = "alert-triangle", title, description, onRetry, retryLabel = "다시 시도", ...props },
    ref,
  ) {
    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col items-center justify-center gap-3 px-6 py-12 text-center",
          className,
        )}
        {...props}
      >
        <span className="inline-flex size-14 items-center justify-center rounded-full bg-red-50">
          <Icon name={icon} size="lg" color="danger" decorative />
        </span>
        <h2 className="text-[18px] font-bold text-text-primary">{title}</h2>
        {description ? (
          <p className="max-w-xs text-[14px] text-text-secondary">{description}</p>
        ) : null}
        {onRetry ? (
          <Button variant="outline" onClick={onRetry} className="mt-2">
            {retryLabel}
          </Button>
        ) : null}
      </div>
    );
  },
);
