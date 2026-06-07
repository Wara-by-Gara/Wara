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
          "rounded-none border-t border-white/40 bg-white/55 backdrop-blur-xl backdrop-saturate-150",
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
              : "text-text-secondary";

          const content = item.fab ? (
            <span className="flex flex-col items-center justify-center -mt-5">
              <span className="relative inline-flex size-12 items-center justify-center rounded-full bg-gradient-to-b from-cranberry-30 to-cranberry-50 shadow-[0_6px_22px_rgba(243,26,124,0.28)] transition-shadow duration-300 hover:shadow-[0_8px_28px_rgba(243,26,124,0.34)]">
                <Icon
                  name={item.icon}
                  size="lg"
                  color="currentColor"
                  strokeWidth={2.25}
                  decorative
                  className="text-white"
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
                    className="absolute -right-1 -top-1 size-2 rounded-full bg-primary ring-2 ring-white/60"
                  />
                ) : null}
              </span>
              {showLabels ? (
                <span className={cn("text-[11px]", active ? "font-semibold" : "")}>{item.label}</span>
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
                !item.disabled && !item.fab && "hover:bg-black/5 transition-colors duration-150",
              )}
            >
              {content}
            </button>
          );

          return renderItem ? (
            <span
              key={item.key}
              className={cn("flex flex-1", colorClass, !item.disabled && !item.fab && "hover:bg-black/5 transition-colors duration-150")}
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
