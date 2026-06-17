"use client";

import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "../../lib/cn.ts";
import { Icon, type IconName } from "../../icons/index.ts";

export interface BottomNavItem {
  key: string;
  label: string;
  icon: IconName;
  /** 새 알림 점 표시 */
  badge?: boolean;
  disabled?: boolean;
  /** 중앙 FAB로 강조 */
  fab?: boolean;
}

export interface BottomNavigationProps
  extends Omit<HTMLAttributes<HTMLElement>, "onSelect"> {
  items: BottomNavItem[];
  activeKey?: string;
  onSelect?: (key: string) => void;
  /** Next.js Link 등으로 감싸기 */
  renderItem?: (item: BottomNavItem, content: ReactNode) => ReactNode;
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
          "border-t border-border bg-surface",
          "pb-[env(safe-area-inset-bottom)]",
          className,
        )}
        {...props}
      >
        {items.map((item) => {
          const active = item.key === activeKey;
          const colorClass = item.disabled
            ? "text-text-disabled"
            : active
              ? "text-text"
              : "text-text-muted";

          const content = item.fab ? (
            <span className="flex flex-col items-center justify-center -mt-5">
              <span className="inline-flex size-12 items-center justify-center rounded-full bg-surface-inverse text-text-inverse shadow-md">
                <Icon name={item.icon} size="lg" color="currentColor" decorative />
              </span>
              {showLabels ? (
                <span className={cn("type-caption mt-1", colorClass)}>{item.label}</span>
              ) : null}
            </span>
          ) : (
            <span className="flex flex-col items-center justify-center gap-0.5">
              <span className="relative">
                <Icon name={item.icon} size="lg" color="currentColor" decorative />
                {item.badge ? (
                  <span
                    aria-hidden
                    className="absolute -right-1 -top-1 size-2 rounded-full bg-accent ring-2 ring-surface"
                  />
                ) : null}
              </span>
              {showLabels ? (
                <span className={cn("type-caption", active && "font-semibold")}>
                  {item.label}
                </span>
              ) : null}
            </span>
          );

          if (renderItem) {
            return (
              <span key={item.key} className={cn("flex flex-1 items-center justify-center", colorClass)}>
                {renderItem(item, content)}
              </span>
            );
          }
          return (
            <button
              key={item.key}
              type="button"
              disabled={item.disabled}
              aria-label={showLabels ? undefined : item.label}
              aria-current={active ? "page" : undefined}
              onClick={() => onSelect?.(item.key)}
              className={cn(
                "flex flex-1 items-center justify-center transition-colors",
                colorClass,
                !item.disabled && !item.fab && "hover:bg-surface-muted",
              )}
            >
              {content}
            </button>
          );
        })}
      </nav>
    );
  },
);
