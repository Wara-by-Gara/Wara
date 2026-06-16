"use client";

import { type ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/cn.ts";
import { IconButton } from "../../atoms/index.ts";

const panelVariants = cva(
  [
    "fixed z-50 flex flex-col gap-4 overflow-y-auto bg-surface p-6 shadow-xl focus:outline-none",
  ],
  {
    variants: {
      side: {
        right: "inset-y-0 right-0 h-full w-[min(360px,90vw)] border-l border-border",
        left: "inset-y-0 left-0 h-full w-[min(360px,90vw)] border-r border-border",
      },
    },
    defaultVariants: { side: "right" },
  },
);

export interface DrawerProps extends VariantProps<typeof panelVariants> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  hideTitle?: boolean;
  children?: ReactNode;
  showClose?: boolean;
  className?: string;
}

export function Drawer({
  open,
  onOpenChange,
  title,
  hideTitle = false,
  children,
  showClose = true,
  side,
  className,
}: DrawerProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px]" />
        <Dialog.Content className={cn(panelVariants({ side }), className)}>
          <div className="flex items-center justify-between gap-3">
            <Dialog.Title
              className={cn("type-cardTitle text-text", hideTitle && "sr-only")}
            >
              {title}
            </Dialog.Title>
            {showClose ? (
              <Dialog.Close asChild>
                <IconButton icon="close" label="닫기" size="sm" className="-mr-2" />
              </Dialog.Close>
            ) : null}
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
