"use client";

import { Toaster as SonnerToaster, toast as sonnerToast } from "sonner";
import { cn } from "@/lib/cn";

export type ToasterProps = React.ComponentPropsWithoutRef<typeof SonnerToaster>;

/**
 * 앱 루트에 1개 마운트하면 됨.
 * DESIGN.md §8 규격: radius 999/16, padding 12 16, 14px 텍스트, 2~3초 노출.
 */
export const Toaster = ({ className, ...props }: ToasterProps) => (
  <SonnerToaster
    position="top-center"
    duration={2500}
    expand={false}
    visibleToasts={1}
    toastOptions={{
      classNames: {
        toast:
          "wara-toast rounded-full bg-gray-900 text-white text-sm font-medium px-4 py-3 shadow-md",
        title: "text-sm",
        description: "text-xs opacity-80",
        actionButton: "text-sm font-bold text-cranberry-30",
      },
    }}
    className={cn("wara-sonner", className)}
    {...props}
  />
);

export const toast = {
  /** 검정 기본 토스트 (DESIGN.md §8 권장) */
  show: (message: string, options?: Parameters<typeof sonnerToast>[1]) =>
    sonnerToast(message, options),
  success: (message: string, options?: Parameters<typeof sonnerToast.success>[1]) =>
    sonnerToast.success(message, options),
  error: (message: string, options?: Parameters<typeof sonnerToast.error>[1]) =>
    sonnerToast.error(message, options),
  info: (message: string, options?: Parameters<typeof sonnerToast.info>[1]) =>
    sonnerToast.info(message, options),
  warning: (message: string, options?: Parameters<typeof sonnerToast.warning>[1]) =>
    sonnerToast.warning(message, options),
  dismiss: sonnerToast.dismiss,
};
