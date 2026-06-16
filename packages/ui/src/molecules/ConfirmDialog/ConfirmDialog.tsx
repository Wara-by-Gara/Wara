"use client";

import { type ReactNode } from "react";
import { Modal } from "../Modal/Modal.tsx";
import { Button } from "../../atoms/index.ts";

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** 확인 시 호출 (닫기는 호출 측에서 onOpenChange로 제어) */
  onConfirm: () => void;
  /** 위험 동작(삭제 등)이면 확인 버튼을 danger로 */
  tone?: "default" | "danger";
  /** 처리 중 — 버튼 로딩/비활성 */
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "확인",
  cancelLabel = "취소",
  onConfirm,
  tone = "default",
  loading = false,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      size="sm"
      showClose={false}
      footer={
        <>
          <Button
            variant="secondary"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={tone === "danger" ? "danger" : "primary"}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </>
      }
    />
  );
}
