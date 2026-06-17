import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface ListPageTemplateProps {
  header?: ReactNode;
  /** 헤더 아래 고정 영역 (SearchBar·Tabs·필터 등) */
  toolbar?: ReactNode;
  children: ReactNode;
  /** 하단 고정 영역 (BottomNavigation 등) */
  footer?: ReactNode;
  className?: string;
}

/**
 * 목록 페이지 골격 — 헤더 + (고정 툴바) + 스크롤 목록 + (하단 내비).
 */
export function ListPageTemplate({
  header,
  toolbar,
  children,
  footer,
  className,
}: ListPageTemplateProps) {
  return (
    <div className={cn("flex min-h-dvh flex-col bg-background", className)}>
      {header || toolbar ? (
        <div className="sticky top-0 z-40 bg-background">
          {header}
          {toolbar ? <div className="px-5 py-2">{toolbar}</div> : null}
        </div>
      ) : null}
      <main className="flex-1 px-5 py-3">{children}</main>
      {footer ? <div className="sticky bottom-0 z-40">{footer}</div> : null}
    </div>
  );
}
