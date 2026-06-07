"use client";

import { forwardRef, type ReactNode } from "react";
import { Icon } from "@/components/icons";
import type { IconName } from "@/components/icons";
import { cn } from "@/lib/cn";

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 아이콘 이름 (또는 children으로 일러스트) */
  icon?: IconName;
  /** Wara 전용 장식 (예: pixel-airplane) 사용 시 색상 */
  iconColor?: "primary" | "default" | "inactive";
  /** 타이틀 */
  title: string;
  /** 설명 */
  description?: ReactNode;
  /** 하단 CTA 슬롯 */
  action?: ReactNode;
}

export const EmptyState = forwardRef<HTMLDivElement, EmptyStateProps>(
  function EmptyState(
    { className, icon = "sparkle", iconColor = "primary", title, description, action, ...props },
    ref,
  ) {
    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col items-center justify-center gap-3 px-page py-12 text-center",
          className,
        )}
        {...props}
      >
        <Icon name={icon} size="xl" color={iconColor} decorative />
        <h2 className="text-[18px] font-bold text-text-primary">{title}</h2>
        {description ? (
          <p className="max-w-xs text-[14px] text-text-secondary">{description}</p>
        ) : null}
        {action ? <div className="mt-2">{action}</div> : null}
      </div>
    );
  },
);
