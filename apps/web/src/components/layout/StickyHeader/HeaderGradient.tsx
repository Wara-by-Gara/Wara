"use client";

import type { CSSProperties } from "react";
import { cn } from "@/lib/cn";

interface HeaderGradientProps {
  className?: string;
  fixed?: boolean;
  hidden?: boolean;
}

const MESH_GRADIENT_STYLE: CSSProperties = {
  backgroundImage: [
    "radial-gradient(ellipse 95% 90% at 2% -22%, rgba(37, 99, 235, 0.48) 0%, transparent 66%)",
    "radial-gradient(ellipse 88% 82% at 22% -8%, rgba(96, 165, 250, 0.34) 0%, transparent 58%)",
    "radial-gradient(ellipse 90% 85% at 42% -14%, rgba(92, 66, 204, 0.46) 0%, transparent 64%)",
    "radial-gradient(ellipse 82% 78% at 58% 0%, rgba(168, 138, 249, 0.4) 0%, transparent 60%)",
    "radial-gradient(ellipse 100% 92% at 100% -18%, rgba(243, 26, 124, 0.42) 0%, transparent 62%)",
    "radial-gradient(ellipse 72% 68% at 84% 6%, rgba(246, 83, 157, 0.32) 0%, transparent 56%)",
    "radial-gradient(ellipse 58% 54% at 12% 10%, rgba(251, 146, 60, 0.24) 0%, transparent 52%)",
    "radial-gradient(ellipse 52% 48% at 70% 14%, rgba(253, 224, 71, 0.16) 0%, transparent 48%)",
    "radial-gradient(ellipse 65% 60% at 48% 8%, rgba(139, 104, 247, 0.26) 0%, transparent 54%)",
    "linear-gradient(180deg, rgba(240, 242, 245, 0.2) 0%, rgba(240, 242, 245, 0.05) 52%, transparent 100%)",
  ].join(", "),
};

/** 상단 aura 그라데이션 — 헤더·히어로 영역 배경 (콘텐츠 뒤 레이어) */
export function HeaderGradient({ className, fixed = false, hidden }: HeaderGradientProps) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none inset-x-0 top-0 mx-auto h-[450px] w-full max-w-md overflow-hidden transition-opacity duration-300",
        fixed ? "fixed z-0" : "absolute z-0",
        hidden && "opacity-0",
        className,
      )}
    >
      <div className="absolute inset-0 saturate-[1.05]" style={MESH_GRADIENT_STYLE} />
    </div>
  );
}
