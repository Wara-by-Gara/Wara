"use client";

import { cn } from "@/lib/cn";
import { BackgroundLayer } from "./layers/BackgroundLayer";
import { MotionLayer } from "./layers/MotionLayer";
import { OverlayLayer } from "./layers/OverlayLayer";
import type { InviteTemplate } from "./types";

/**
 * 초대장 테마 배경(Background + Motion + Overlay)만 풀블리드로 깐다 — ContentLayer 제외.
 * 이벤트 상세 화면처럼 실제 콘텐츠를 그 위에 올릴 때 페이지 배경으로 사용.
 * (부모는 relative/isolate, 콘텐츠는 그 위 z-인덱스)
 */
export function InviteBackdrop({
  template,
  paused = false,
  className,
}: {
  template: InviteTemplate;
  paused?: boolean;
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 -z-10 overflow-hidden", className)}
      style={{ background: template.palette.base }}
    >
      <BackgroundLayer spec={template.background} palette={template.palette} />
      <MotionLayer spec={template.motion} palette={template.palette} paused={paused} />
      <OverlayLayer spec={template.overlay} />
    </div>
  );
}
