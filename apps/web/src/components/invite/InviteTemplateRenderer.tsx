"use client";

import { cn } from "@/lib/cn";
import { BackgroundLayer } from "./layers/BackgroundLayer";
import { MotionLayer } from "./layers/MotionLayer";
import { OverlayLayer } from "./layers/OverlayLayer";
import { ContentLayer } from "./layers/ContentLayer";
import type { InviteContent, InviteTemplate } from "./types";

export interface InviteTemplateRendererProps {
  template: InviteTemplate;
  content: InviteContent;
  /** 종횡비 (기본 4:5). fullBleed 시 무시 */
  aspect?: string;
  /**
   * 풀블리드 — 카드(둥근 모서리·종횡비) 없이 부모를 가득 채움.
   * Partiful 이벤트 상세처럼 화면 배경으로 깔 때 사용.
   */
  fullBleed?: boolean;
  /** 모션 정지 (미리보기 등) */
  paused?: boolean;
  className?: string;
}

/**
 * 템플릿 데이터 → 4레이어 합성. 템플릿별 조건분기 없음(전부 preset 조회).
 * 3축(background=Theme · font=Font · motion=Effect) 독립.
 * 미리보기·카드·풀블리드(이벤트 상세 배경)가 동일 렌더러를 사용한다.
 */
export function InviteTemplateRenderer({
  template,
  content,
  aspect = "4 / 5",
  fullBleed = false,
  paused = false,
  className,
}: InviteTemplateRendererProps) {
  return (
    <div
      className={cn(
        "@container relative isolate overflow-hidden",
        fullBleed ? "h-full w-full" : "w-full rounded-2xl",
        className,
      )}
      style={{
        background: template.palette.base,
        ...(fullBleed ? null : { aspectRatio: aspect }),
      }}
    >
      <BackgroundLayer spec={template.background} palette={template.palette} />
      <MotionLayer spec={template.motion} palette={template.palette} paused={paused} />
      <OverlayLayer spec={template.overlay} />
      <ContentLayer
        content={content}
        palette={template.palette}
        layout={template.layout}
        typography={template.typography}
        font={template.font}
      />
    </div>
  );
}
