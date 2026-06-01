"use client";

import { TopAppBar, type TopAppBarProps } from "@/components/molecules/TopAppBar";
import { useHideOnScroll } from "@/hooks/useHideOnScroll";
import { cn } from "@/lib/cn";
import { HeaderGradient } from "./HeaderGradient";

/**
 * 상단 고정 헤더.
 * - 투명 TopAppBar 위에 파스텔 그라데이션이 자연스럽게 이어진다.
 * - 아래로 스크롤하면 그라데이션·헤더 내용이 함께 페이드아웃된다.
 */
export function StickyHeader({ className, ...props }: TopAppBarProps) {
  const hidden = useHideOnScroll();

  return (
    <>
      <HeaderGradient fixed hidden={hidden} />

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
