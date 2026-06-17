import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface AppShellProps {
  /** 상단 고정 영역 (TopAppBar 등) */
  header?: ReactNode;
  /** 하단 고정 영역 (BottomNavigation 등) */
  footer?: ReactNode;
  children: ReactNode;
  /** main 영역 클래스 */
  contentClassName?: string;
  className?: string;
}

/**
 * 앱 기본 골격 — 상단 고정 헤더 + 스크롤 본문 + 하단 고정 푸터.
 * 헤더/푸터는 슬롯으로 받아 @wara/ui 컴포넌트를 조합한다.
 */
export function AppShell({
  header,
  footer,
  children,
  contentClassName,
  className,
}: AppShellProps) {
  return (
    <div className={cn("flex min-h-dvh flex-col bg-background", className)}>
      {header ? (
        <div className="sticky top-0 z-40">{header}</div>
      ) : null}
      <main className={cn("flex-1", contentClassName)}>{children}</main>
      {footer ? <div className="sticky bottom-0 z-40">{footer}</div> : null}
    </div>
  );
}
