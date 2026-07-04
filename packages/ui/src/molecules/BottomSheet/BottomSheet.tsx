"use client";

import { type ReactNode } from "react";
import { Drawer as Vaul } from "vaul";
import { cn } from "../../lib/cn.ts";

export interface BottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 접근성 필수 */
  title: ReactNode;
  hideTitle?: boolean;
  description?: ReactNode;
  children?: ReactNode;
  className?: string;
}

export function BottomSheet({
  open,
  onOpenChange,
  title,
  hideTitle = false,
  description,
  children,
  className,
}: BottomSheetProps) {
  return (
    <Vaul.Root open={open} onOpenChange={onOpenChange}>
      <Vaul.Portal>
        <Vaul.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px]" />
        <Vaul.Content
          className={cn(
            // iOS 26 시트 코너 곡률 미러 (모바일 네이티브 시트와 정렬)
            "fixed inset-x-0 bottom-0 z-50 mt-24 flex max-h-[92dvh] flex-col rounded-t-[28px]",
            "border-t border-border bg-surface focus:outline-none",
            className,
          )}
        >
          {/* 드래그 핸들 */}
          <div className="mx-auto mt-2.5 h-1.5 w-10 shrink-0 rounded-full bg-border-strong" />
          <div className="flex flex-col gap-1 overflow-y-auto px-5 pb-[max(20px,env(safe-area-inset-bottom))] pt-3">
            <Vaul.Title
              className={cn("type-cardTitle text-text", hideTitle && "sr-only")}
            >
              {title}
            </Vaul.Title>
            {description ? (
              <Vaul.Description className="type-bodySmall text-text-muted">
                {description}
              </Vaul.Description>
            ) : (
              <Vaul.Description className="sr-only">{title}</Vaul.Description>
            )}
            <div className="mt-3">{children}</div>
          </div>
        </Vaul.Content>
      </Vaul.Portal>
    </Vaul.Root>
  );
}
