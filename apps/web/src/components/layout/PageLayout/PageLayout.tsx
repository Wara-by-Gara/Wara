"use client";

import { forwardRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export type PageLayoutVariant =
  | "with-top-bar"
  | "with-bottom-nav"
  | "with-sticky-cta"
  | "full-screen"
  | "scroll-view"
  | "modal-page";

/**
 * 콘텐츠 최대 폭. 모바일/태블릿(<lg)은 항상 `max-w-md` 중앙 정렬로 동일하고,
 * 데스크톱(lg:)에서만 확장된다. (docs/decisions/responsive-desktop-architecture.md)
 */
export type PageLayoutSize = "sm" | "md" | "lg" | "full";

const SIZE_MAX_W: Record<PageLayoutSize, string> = {
  sm: "max-w-md lg:max-w-2xl", // 폼/설정
  md: "max-w-md lg:max-w-4xl", // 상세
  lg: "max-w-md lg:max-w-7xl", // 목록/그리드
  full: "max-w-none", // 채팅/지도/대시보드 (full-bleed)
};

export interface PageLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: PageLayoutVariant;
  /** 콘텐츠 최대 폭 (데스크톱에서만 확장, <lg는 항상 max-w-md) */
  size?: PageLayoutSize;
  /** 상단 영역 (TopAppBar 등) */
  topBar?: ReactNode;
  /** 하단 영역 (BottomNavigation 또는 StickyCTA) */
  bottomBar?: ReactNode;
  /** 콘텐츠 좌우 padding 끄기 */
  noPadding?: boolean;
  children: ReactNode;
}

export const PageLayout = forwardRef<HTMLDivElement, PageLayoutProps>(
  function PageLayout(
    {
      className,
      variant = "with-top-bar",
      size = "sm",
      topBar,
      bottomBar,
      noPadding,
      children,
      ...props
    },
    ref,
  ) {
    const isModalPage = variant === "modal-page";

    return (
      <div
        ref={ref}
        className={cn(
          "flex w-full flex-col bg-background mx-auto min-h-screen",
          SIZE_MAX_W[size],
          isModalPage && "rounded-t-lg shadow-lg",
          className,
        )}
        {...props}
      >
        {topBar ? <div className="sticky top-0 z-20">{topBar}</div> : null}
        <main
          className={cn(
            "flex-1",
            !noPadding && "px-page py-4",
            variant === "scroll-view" && "overflow-y-auto",
          )}
        >
          {children}
        </main>
        {bottomBar}
      </div>
    );
  },
);
