"use client";

import { forwardRef } from "react";
import { Icon } from "@/components/icons";
import type { IconName } from "@/components/icons";
import { cn } from "@/lib/cn";

export interface ShareOptionItemProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** 좌측 아이콘 이름 */
  icon: IconName;
  /** 옵션 타이틀 */
  title: string;
  /** 부가 설명 (선택) */
  description?: string;
  /** 아이콘 배경색 토큰 — 카카오/링크 등 옵션별 색 구분 */
  iconBg?: string;
  /** 아이콘 색상 클래스 */
  iconColor?: string;
}

export const ShareOptionItem = forwardRef<HTMLButtonElement, ShareOptionItemProps>(
  function ShareOptionItem(
    {
      className,
      icon,
      title,
      description,
      iconBg = "bg-surface",
      iconColor = "text-text-primary",
      ...props
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left hover:bg-gray-50 transition-colors duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
          className,
        )}
        {...props}
      >
        <span
          className={cn(
            "inline-flex size-11 shrink-0 items-center justify-center rounded-md",
            iconBg,
            iconColor,
          )}
        >
          <Icon name={icon} size="lg" color="currentColor" decorative />
        </span>
        <span className="flex flex-1 flex-col gap-0.5">
          <span className="text-[15px] font-semibold text-text-primary">{title}</span>
          {description ? (
            <span className="text-[13px] text-text-secondary">{description}</span>
          ) : null}
        </span>
      </button>
    );
  },
);
