"use client";

import { useState } from "react";
import { Icon } from "@/components/icons";
import { cn } from "@/lib/cn";
import { LumaButton } from "./Button";

export function LumaModal({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-black/60" onClick={onClose} aria-label="Close overlay" />
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 w-full max-w-sm rounded-lg border border-border bg-gray-900/90 p-5 shadow-xl backdrop-blur-md"
      >
        <h3 className="mb-3 text-lg font-semibold text-text-primary">{title}</h3>
        <div className="text-sm text-text-secondary">{children}</div>
        {footer ? <div className="mt-4 flex justify-end gap-2">{footer}</div> : null}
      </div>
    </div>
  );
}

export function LumaMenu({ items }: { items: string[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative inline-block">
      <LumaButton color="light" onClick={() => setOpen((v) => !v)}>메뉴 열기</LumaButton>
      {open ? (
        <div className="absolute left-0 top-full z-10 mt-1 min-w-[160px] rounded-sm border border-border bg-gray-900 py-1 shadow-lg">
          {items.map((item) => (
            <button
              key={item}
              type="button"
              className="block w-full px-3 py-2 text-left text-sm text-text-primary hover:bg-gray-700/30"
            >
              {item}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function LumaTooltip({
  content,
  position = "top",
}: {
  content: string;
  position?: "top" | "right" | "bottom" | "left";
}) {
  const posClass = {
    top: "bottom-full left-1/2 mb-2 -translate-x-1/2",
    right: "left-full top-1/2 ml-2 -translate-y-1/2",
    bottom: "top-full left-1/2 mt-2 -translate-x-1/2",
    left: "right-full top-1/2 mr-2 -translate-y-1/2",
  }[position];
  return (
    <div className="group relative inline-flex">
      <button type="button" className="text-text-tertiary hover:text-text-primary">
        <Icon name="info" size="sm" color="currentColor" decorative />
      </button>
      <span className={cn("pointer-events-none absolute hidden whitespace-nowrap rounded-xs bg-gray-800 px-2 py-1 text-xs text-white group-hover:block", posClass)}>
        {content}
      </span>
    </div>
  );
}

export function LumaToast({
  variant,
  message,
}: {
  variant: "success" | "error" | "loading";
  message: string;
}) {
  const styles = {
    success: "bg-green-600 text-white",
    error: "bg-red-600 text-white",
    loading: "bg-gray-700 text-white",
  };
  return (
    <div className={cn("inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm", styles[variant])}>
      {variant === "loading" ? (
        <span className="inline-block size-3 animate-spin rounded-full border-2 border-white border-r-transparent" />
      ) : (
        <Icon name={variant === "success" ? "check-circle" : "x-circle"} size="xs" color="inverse" decorative />
      )}
      {message}
    </div>
  );
}

export function LumaLightbox({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="overflow-hidden rounded-sm">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} className="max-h-64 w-full object-cover" />
    </div>
  );
}

export function LumaOverlayShowcase() {
  const [modalOpen, setModalOpen] = useState(false);
  return (
    <div className="flex flex-wrap gap-3">
      <LumaButton color="light" onClick={() => setModalOpen(true)}>모달 열기</LumaButton>
      <LumaMenu items={["수정", "복제", "보관", "삭제"]} />
      <LumaTooltip content="도움말 툴팁" position="top" />
      <LumaToast variant="success" message="저장되었습니다" />
      <LumaModal open={modalOpen} onClose={() => setModalOpen(false)} title="모달 제목" footer={<LumaButton color="primary" onClick={() => setModalOpen(false)}>확인</LumaButton>}>
        모달 본문 내용이 여기에 표시됩니다.
      </LumaModal>
    </div>
  );
}
