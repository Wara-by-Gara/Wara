"use client";

import { TopAppBar, type TopAppBarProps } from "@/components/molecules/TopAppBar";
import { useHideOnScroll } from "@/hooks/useHideOnScroll";
import { cn } from "@/lib/cn";
import { HeaderGradient } from "./HeaderGradient";

/**
 * 상단 고정 헤더.
 * - 투명 TopAppBar 뒤에 aura 그라데이션이 깔린다.
 * - 아래로 스크롤하면 헤더 내용만 페이드아웃된다.
 */
export function StickyHeader({ className, ...props }: TopAppBarProps) {
  const hidden = useHideOnScroll();

  return (
    <>
      <HeaderGradient fixed />
      <div
        className={cn(
          "fixed inset-x-0 top-0 z-30 mx-auto w-full max-w-md transition-opacity duration-300",
          hidden ? "pointer-events-none opacity-0" : "opacity-100",
        )}
      >
        <TopAppBar {...props} variant="transparent" className={className} />
      </div>
    </>
  );
}
