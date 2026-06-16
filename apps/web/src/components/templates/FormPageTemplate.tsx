import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface FormPageTemplateProps {
  /** 상단 고정 헤더 (TopAppBar 등) */
  header?: ReactNode;
  /** 폼 본문 */
  children: ReactNode;
  /** 하단 고정 액션 바 (제출 버튼 등) */
  actions?: ReactNode;
  className?: string;
}

/**
 * 폼 페이지 골격 — 헤더 + 스크롤 폼 + 하단 고정 액션 바(safe-area).
 */
export function FormPageTemplate({
  header,
  children,
  actions,
  className,
}: FormPageTemplateProps) {
  return (
    <div className={cn("flex min-h-dvh flex-col bg-background", className)}>
      {header ? <div className="sticky top-0 z-40">{header}</div> : null}
      <main className="flex-1 px-5 py-6">
        <div className="mx-auto flex w-full max-w-lg flex-col gap-5">{children}</div>
      </main>
      {actions ? (
        <div className="sticky bottom-0 z-40 border-t border-border bg-surface px-5 py-3 pb-[max(12px,env(safe-area-inset-bottom))]">
          <div className="mx-auto flex w-full max-w-lg gap-2">{actions}</div>
        </div>
      ) : null}
    </div>
  );
}
