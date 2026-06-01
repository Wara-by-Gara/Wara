"use client";

import { forwardRef, type ReactNode } from "react";
import { Icon } from "@/components/icons";
import type { IconName } from "@/components/icons";
import { cn } from "@/lib/cn";

export interface BottomNavItem {
  /** 라우트 key (active 비교용) */
  key: string;
  label: string;
  icon: IconName;
  /** 새 알림 배지 표시 */
  badge?: boolean;
  /** 비활성 */
  disabled?: boolean;
  /** 중앙 FAB로 강조할 항목 */
  fab?: boolean;
}

export interface BottomNavigationProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "onSelect"> {
  items: BottomNavItem[];
  /** 현재 활성 key */
  activeKey?: string;
  /** 항목 클릭 콜백 */
  onSelect?: (key: string) => void;
  /** Next.js Link 등으로 wrap (선택) */
  renderItem?: (item: BottomNavItem, content: ReactNode) => ReactNode;
  /** 아이콘 하단 텍스트 라벨 표시 (기본 true) */
  showLabels?: boolean;
}

export const BottomNavigation = forwardRef<HTMLElement, BottomNavigationProps>(
  function BottomNavigation(
    { className, items, activeKey, onSelect, renderItem, showLabels = true, ...props },
    ref,
  ) {
    return (
      <nav
        ref={ref}
        aria-label="주요 탭"
        className={cn(
          "flex h-16 w-full items-stretch justify-around",
          "rounded-full border border-border bg-surface",
          className,
        )}
        {...props}
      >
        {items.map((item) => {
          const active = item.key === activeKey;
          const colorClass = item.disabled
            ? "text-text-tertiary opacity-40"
            : active
              ? "text-primary"
              : "text-gray-400";

          const content = item.fab ? (
            <span className="flex flex-col items-center justify-center -mt-5">
              <span className="relative inline-flex size-12 items-center justify-center rounded-full shadow-[0_6px_22px_rgba(232,151,177,0.38)] transition-[transform,box-shadow] duration-300 hover-emphasis-sm">
                <span
                  aria-hidden
                  className="absolute inset-0 rounded-full bg-[linear-gradient(180deg,#F4B8C9_0%,#E897B1_100%)]"
                />
                <span
                  aria-hidden
                  className={cn(
                    "absolute inset-0 rounded-full",
                    "border border-white/50",
                    "bg-[linear-gradient(180deg,rgba(255,255,255,0.38)_0%,rgba(255,255,255,0.16)_42%,rgba(255,255,255,0.06)_100%)]",
                    "backdrop-blur-[20px] backdrop-saturate-150",
                    "shadow-[inset_0_1.5px_1px_rgba(255,255,255,0.82),inset_0_-1px_2px_rgba(255,255,255,0.22)]",
                  )}
                />
                <Icon
                  name={item.icon}
                  size="lg"
                  color="currentColor"
                  strokeWidth={2.25}
                  decorative
                  className="relative z-10 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.55)]"
                />
              </span>
              {showLabels ? (
                <span className={cn("mt-1 text-[11px]", colorClass)}>{item.label}</span>
              ) : null}
            </span>
          ) : (
            <span className="flex flex-col items-center justify-center gap-0.5">
              <span className="relative">
                <Icon name={item.icon} size="lg" color="currentColor" decorative />
                {item.badge ? (
                  <span
                    aria-hidden
                    className="absolute -right-1 -top-1 size-2 rounded-full bg-primary ring-2 ring-surface"
                  />
                ) : null}
              </span>
              {showLabels ? (
                <span className={cn("text-[11px]", active ? "font-bold" : "")}>{item.label}</span>
              ) : null}
            </span>
          );

          const wrapper = (
            <button
              key={item.key}
              type="button"
              disabled={item.disabled}
              aria-label={showLabels ? undefined : item.label}
              aria-current={active ? "page" : undefined}
              onClick={() => onSelect?.(item.key)}
              className={cn(
                "flex flex-1 items-center justify-center",
                colorClass,
                !item.disabled && !item.fab && "hover-emphasis-sm",
              )}
            >
              {content}
            </button>
          );

          return renderItem ? (
            <span
              key={item.key}
              className={cn("flex flex-1", colorClass, !item.disabled && !item.fab && "hover-emphasis-sm")}
            >
              {renderItem(item, content)}
            </span>
          ) : (
            wrapper
          );
        })}
      </nav>
    );
  },
);
