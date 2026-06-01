"use client";

import { cn } from "@/lib/cn";

interface HeaderGradientProps {
  className?: string;
  fixed?: boolean;
  hidden?: boolean;
}

/** 상단 파스텔 그라데이션 — 헤더·히어로 영역에 자연스럽게 블렌드 */
export function HeaderGradient({ className, fixed = false, hidden }: HeaderGradientProps) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none inset-x-0 top-0 mx-auto h-[168px] w-full max-w-md overflow-hidden transition-opacity duration-300",
        fixed ? "fixed z-0" : "absolute z-0",
        hidden && "opacity-0",
        className,
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-sky-200 via-yellow-200 to-pink-300" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent from-0% via-background-soft/50 via-[70%] to-background-soft" />
    </div>
  );
}
