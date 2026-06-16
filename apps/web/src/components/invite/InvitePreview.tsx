"use client";

import { InviteTemplateRenderer } from "./InviteTemplateRenderer";
import type { InviteContent, InviteTemplate } from "./types";

const SAMPLE: InviteContent = {
  title: "와라 송년 파티",
  hostName: "민지",
  dateText: "12월 24일 (화) 오후 7시",
  locationText: "성수동 라운지",
};

/**
 * 리스트/선택용 미리보기. 동일 렌더러를 쓰되 기본 모션 정지(성능).
 * motion 프로퍼티로 살아있는 미리보기도 가능.
 */
export function InvitePreview({
  template,
  content = SAMPLE,
  animated = false,
  className,
}: {
  template: InviteTemplate;
  content?: InviteContent;
  animated?: boolean;
  className?: string;
}) {
  return (
    <InviteTemplateRenderer
      template={template}
      content={content}
      paused={!animated}
      className={className}
    />
  );
}
