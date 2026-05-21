"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { forwardRef, type ReactNode } from "react";
import { Button } from "@/components/primitives/Button";
import type { ButtonProps } from "@/components/primitives/Button";
import { cn } from "@/lib/cn";

export const Modal = Dialog.Root;
export const ModalTrigger = Dialog.Trigger;
export const ModalPortal = Dialog.Portal;
export const ModalClose = Dialog.Close;

export const ModalOverlay = forwardRef<
  React.ComponentRef<typeof Dialog.Overlay>,
  React.ComponentPropsWithoutRef<typeof Dialog.Overlay>
>(function ModalOverlay({ className, ...props }, ref) {
  return (
    <Dialog.Overlay
      ref={ref}
      className={cn(
        "fixed inset-0 z-50 bg-black/48 data-[state=open]:animate-in data-[state=open]:fade-in",
        className,
      )}
      {...props}
    />
  );
});

export type ModalContentProps = React.ComponentPropsWithoutRef<typeof Dialog.Content> & {
  /** true면 Portal 없이 부모(relative) 안에 렌더 — Storybook 베젤 등 */
  contained?: boolean;
};

export const ModalContent = forwardRef<
  React.ComponentRef<typeof Dialog.Content>,
  ModalContentProps
>(function ModalContent({ className, children, contained = false, ...props }, ref) {
  const overlayClass = cn(
    "z-50 bg-black/48 data-[state=open]:animate-in data-[state=open]:fade-in",
    contained ? "absolute inset-0" : "fixed inset-0",
  );
  const contentClass = cn(
    "left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2",
    "rounded-3xl bg-surface p-5 shadow-lg",
    "focus:outline-none",
    "data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-95",
    contained
      ? "absolute w-[calc(100%-32px)] max-w-[300px]"
      : "fixed w-[calc(100vw-40px)] max-w-md p-6",
    className,
  );

  if (contained) {
    return (
      <>
        <Dialog.Overlay className={overlayClass} />
        <Dialog.Content ref={ref} className={contentClass} {...props}>
          {children}
        </Dialog.Content>
      </>
    );
  }

  return (
    <Dialog.Portal>
      <ModalOverlay />
      <Dialog.Content ref={ref} className={contentClass} {...props}>
        {children}
      </Dialog.Content>
    </Dialog.Portal>
  );
});

export interface ConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: ReactNode;
  /** 확인 버튼 라벨 */
  confirmLabel?: string;
  /** 취소 버튼 라벨 */
  cancelLabel?: string;
  /** 확인 버튼 variant — 위험 액션은 'danger' */
  confirmVariant?: ButtonProps["variant"];
  onConfirm?: () => void;
  loading?: boolean;
  /** Storybook 베젤 등 부모 영역 안에 모달을 맞출 때 */
  contained?: boolean;
}

/** 간편 확인 다이얼로그. DESIGN.md §16 규칙(버튼 최대 2개, 취소 좌 확인 우) 적용. */
export const ConfirmModal = ({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "확인",
  cancelLabel = "취소",
  confirmVariant = "primary",
  onConfirm,
  loading,
  contained = false,
}: ConfirmModalProps) => (
  <Modal open={open} onOpenChange={onOpenChange}>
    <ModalContent contained={contained}>
      <Dialog.Title className="text-[18px] font-bold text-text-primary">{title}</Dialog.Title>
      {description ? (
        <Dialog.Description className="mt-2 text-[15px] text-text-secondary">
          {description}
        </Dialog.Description>
      ) : null}
      <div className="mt-6 flex gap-2">
        <ModalClose asChild>
          <Button variant="outline" fullWidth>
            {cancelLabel}
          </Button>
        </ModalClose>
        <Button
          variant={confirmVariant}
          fullWidth
          loading={loading}
          onClick={onConfirm}
        >
          {confirmLabel}
        </Button>
      </div>
    </ModalContent>
  </Modal>
);

export { Dialog as ModalPrimitive };
