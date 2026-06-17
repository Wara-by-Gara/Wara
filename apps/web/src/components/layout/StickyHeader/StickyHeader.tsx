"use client";

import { TopAppBar, type TopAppBarProps } from "@wara/ui";
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
      {/* 데스크톱(lg)에선 전역 TopNavigation이 상단을 차지하므로 page aura는 숨김 */}
      <HeaderGradient fixed className="lg:hidden" />
      {/* 모바일/태블릿: 상단 고정. 데스크톱: sticky 해제 → 본문 컬럼 최상단 인라인 헤더로 강등 (2단 헤더 방지) */}
      <div
        className={cn(
          "fixed inset-x-0 top-0 z-30 mx-auto w-full max-w-md transition-opacity duration-300",
          "lg:static lg:opacity-100 lg:pointer-events-auto",
          hidden ? "pointer-events-none opacity-0" : "opacity-100",
        )}
      >
        <TopAppBar {...props} variant="transparent" className={className} />
      </div>
    </>
  );
}
