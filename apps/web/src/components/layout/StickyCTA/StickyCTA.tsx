"use client";

import { forwardRef, type ReactNode } from "react";
import { Button, type ButtonProps } from "@wara/ui";
import { cn } from "@/lib/cn";

export interface StickyCTAProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Primary 버튼 */
  primary: {
    label: string;
    onClick?: () => void;
    variant?: ButtonProps["variant"];
    disabled?: boolean;
    loading?: boolean;
  };
  /** Secondary 버튼 (있으면 두 버튼 모드) */
  secondary?: {
    label: string;
    onClick?: () => void;
    variant?: ButtonProps["variant"];
  };
  /** 좌측 정보 슬롯 (가격/상태 등) */
  leftInfo?: ReactNode;
}

export const StickyCTA = forwardRef<HTMLDivElement, StickyCTAProps>(
  function StickyCTA({ className, primary, secondary, leftInfo, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={cn(
          "sticky bottom-0 z-30 flex w-full items-center gap-3 border-t border-border bg-surface",
          "px-page pt-3 pb-[calc(env(safe-area-inset-bottom)+12px)]",
          className,
        )}
        {...props}
      >
        {leftInfo ? <div className="shrink-0">{leftInfo}</div> : null}
        <div className="flex flex-1 gap-2">
          {secondary ? (
            <Button
              variant={secondary.variant ?? "secondary"}
              size="lg"
              fullWidth
              onClick={secondary.onClick}
            >
              {secondary.label}
            </Button>
          ) : null}
          <Button
            variant={primary.variant ?? "primary"}
            size="lg"
            fullWidth
            onClick={primary.onClick}
            disabled={primary.disabled}
            loading={primary.loading}
          >
            {primary.label}
          </Button>
        </div>
      </div>
    );
  },
);
