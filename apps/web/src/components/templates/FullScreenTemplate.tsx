import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface FullScreenTemplateProps {
  children: ReactNode;
  /** 콘텐츠 위에 떠 있는 상단 영역 (뒤로가기·액션) */
  overlayTop?: ReactNode;
  /** 하단에 고정되는 영역 (CTA 등) */
  overlayBottom?: ReactNode;
  className?: string;
}

/**
 * 풀스크린 골격 — 초대장 상세·지도 등 가장자리까지 채우는 화면.
 * 상/하단 오버레이는 콘텐츠 위에 떠서 배치된다.
 */
export function FullScreenTemplate({
  children,
  overlayTop,
  overlayBottom,
  className,
}: FullScreenTemplateProps) {
  return (
    <div className={cn("relative min-h-dvh bg-background", className)}>
      {children}
      {overlayTop ? (
        <div className="pointer-events-none absolute inset-x-0 top-0 z-40 p-4 pt-[max(12px,env(safe-area-inset-top))]">
          <div className="pointer-events-auto">{overlayTop}</div>
        </div>
      ) : null}
      {overlayBottom ? (
        <div className="absolute inset-x-0 bottom-0 z-40 p-4 pb-[max(16px,env(safe-area-inset-bottom))]">
          {overlayBottom}
        </div>
      ) : null}
    </div>
  );
}
