"use client";

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Icon, type IconName } from "@wara/ui";
import { cn } from "@/lib/cn";

export interface ShareOptionItemProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** 좌측 아이콘 이름 (iconNode가 있으면 무시) */
  icon?: IconName;
  /** 좌측 커스텀 노드 (브랜드 로고 등 — 레지스트리 밖 아이콘) */
  iconNode?: ReactNode;
  /** 옵션 타이틀 */
  title: string;
  /** 부가 설명 (선택) */
  description?: string;
  /** 아이콘 배경색 토큰 — 카카오/링크 등 옵션별 색 구분 */
  iconBg?: string;
  /** 아이콘 색상 클래스 */
  iconColor?: string;
}

export const ShareOptionItem = forwardRef<
  HTMLButtonElement,
  ShareOptionItemProps
>(function ShareOptionItem(
  {
    className,
    icon,
    iconNode,
    title,
    description,
    iconBg = "bg-surface",
    iconColor = "text-text",
    ...props
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      className={cn(
        "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors hover:bg-surface-muted",
        "focus-visible:outline-none focus-visible:[box-shadow:var(--focus-ring)]",
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
        {iconNode ??
          (icon ? (
            <Icon name={icon} size="lg" color="currentColor" decorative />
          ) : null)}
      </span>
      <span className="flex flex-1 flex-col gap-0.5">
        <span className="type-body font-semibold text-text">{title}</span>
        {description ? (
          <span className="type-bodySmall text-text-muted">{description}</span>
        ) : null}
      </span>
    </button>
  );
});
