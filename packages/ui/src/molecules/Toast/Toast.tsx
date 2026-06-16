"use client";

import { Toaster as Sonner, toast } from "sonner";
import { cn } from "../../lib/cn.ts";

type SonnerProps = React.ComponentProps<typeof Sonner>;

/**
 * 앱 루트에 한 번 마운트. sonner를 unstyled로 두고 토큰 클래스로 스타일링 →
 * data-theme(라이트/다크)에 자동 대응한다. 호출은 `toast(...)`로.
 */
export function Toaster({ className, toastOptions, ...props }: SonnerProps) {
  return (
    <Sonner
      position="top-center"
      className={cn("toaster", className)}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            "flex w-full items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3 text-text shadow-lg type-bodySmall",
          title: "font-semibold text-text",
          description: "type-caption text-text-muted",
          actionButton:
            "ml-auto shrink-0 rounded-md bg-surface-inverse px-2.5 py-1 type-caption font-semibold text-text-inverse",
          cancelButton:
            "shrink-0 rounded-md bg-surface-muted px-2.5 py-1 type-caption text-text",
          icon: "shrink-0",
          error: "border-danger/40",
          success: "border-success/40",
        },
        ...toastOptions,
      }}
      {...props}
    />
  );
}

export { toast };
