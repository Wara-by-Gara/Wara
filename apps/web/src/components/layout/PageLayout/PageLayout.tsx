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

export interface PageLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: PageLayoutVariant;
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
          "flex w-full max-w-md flex-col bg-background mx-auto min-h-screen",
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
