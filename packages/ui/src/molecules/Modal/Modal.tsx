"use client";

import { type ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/cn.ts";
import { IconButton } from "../../atoms/index.ts";

const contentVariants = cva(
  [
    "fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2",
    "w-[calc(100vw-2rem)] max-h-[calc(100dvh-2rem)] overflow-y-auto",
    "rounded-xl border border-border bg-surface p-6 shadow-xl",
    "focus:outline-none",
  ],
  {
    variants: {
      size: {
        sm: "max-w-sm",
        md: "max-w-md",
        lg: "max-w-lg",
      },
    },
    defaultVariants: { size: "md" },
  },
);

export interface ModalProps extends VariantProps<typeof contentVariants> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 접근성 필수 — 시각적으로 숨기려면 hideTitle */
  title: ReactNode;
  /** 제목을 시각적으로 숨김 (스크린리더에는 유지) */
  hideTitle?: boolean;
  description?: ReactNode;
  children?: ReactNode;
  /** 하단 액션 영역 (버튼 등) */
  footer?: ReactNode;
  /** 우측 상단 닫기 버튼 표시 (기본 true) */
  showClose?: boolean;
  className?: string;
}

export function Modal({
  open,
  onOpenChange,
  title,
  hideTitle = false,
  description,
  children,
  footer,
  showClose = true,
  size,
  className,
}: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px]" />
        <Dialog.Content className={cn(contentVariants({ size }), className)}>
          <Dialog.Title
            className={cn("type-cardTitle text-text", hideTitle && "sr-only")}
          >
            {title}
          </Dialog.Title>
          {description ? (
            <Dialog.Description className="type-bodySmall mt-1.5 text-text-muted">
              {description}
            </Dialog.Description>
          ) : null}
          {children ? <div className="mt-4">{children}</div> : null}
          {footer ? (
            <div className="mt-6 flex justify-end gap-2">{footer}</div>
          ) : null}
          {showClose ? (
            <Dialog.Close asChild>
              <IconButton
                icon="close"
                label="닫기"
                size="sm"
                className="absolute right-3 top-3"
              />
            </Dialog.Close>
          ) : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
