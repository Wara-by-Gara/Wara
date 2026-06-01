"use client";

import { forwardRef, type ReactNode } from "react";
import { Icon } from "@/components/icons";
import { Avatar } from "@/components/primitives/Avatar";
import { Badge, type BadgeProps } from "@/components/primitives/Badge";
import { IconButton } from "@/components/primitives/IconButton";
import { cn } from "@/lib/cn";

export type ParticipantRsvp = "attending" | "maybe" | "declined" | "noResponse";

const RSVP_LABEL: Record<ParticipantRsvp, { label: string; variant: BadgeProps["variant"] }> = {
  attending: { label: "참석", variant: "attending" },
  maybe: { label: "미정", variant: "maybe" },
  declined: { label: "불참", variant: "declined" },
  noResponse: { label: "미응답", variant: "noResponse" },
};

export interface ParticipantItemProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string;
  avatarName?: string;
  handle?: string;
  avatarUrl?: string;
  /** RSVP 상태 */
  status: ParticipantRsvp;
  /** 호스트 표시 */
  isHost?: boolean;
  /** 동반 인원 수 (>=1 표시) */
  companionCount?: number;
  /** 요청사항 미리보기 */
  requestPreview?: string;
  /** 호스트 메모 (host 화면만) */
  memo?: string;
  /** RSVP 라벨 커스텀 (없으면 기본값) */
  labelOverride?: string;
  /** 더보기 버튼 콜백 (host) */
  onMore?: () => void;
  /** 추가 우측 슬롯 */
  rightSlot?: ReactNode;
}

export const ParticipantItem = forwardRef<HTMLDivElement, ParticipantItemProps>(
  function ParticipantItem(
    {
      className,
      name,
      avatarName,
      handle,
      avatarUrl,
      status,
      isHost,
      companionCount,
      requestPreview,
      memo,
      labelOverride,
      onMore,
      rightSlot,
      ...props
    },
    ref,
  ) {
    const rsvp = RSVP_LABEL[status];
    const displayLabel = labelOverride ?? rsvp.label;
    return (
      <div
        ref={ref}
        className={cn("flex items-start gap-3 py-3", className)}
        {...props}
      >
        <Avatar src={avatarUrl} alt={name} size="md" name={avatarName ?? name} host={isHost} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="truncate text-[15px] font-semibold text-text-primary">
              {name}
              {handle ? (
                <span className="ml-1 font-normal text-text-tertiary">@{handle}</span>
              ) : null}
            </p>
            {isHost ? (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-yellow-100 px-1.5 text-[11px] font-bold text-yellow-400">
                <Icon name="crown" size="xs" color="currentColor" decorative /> 호스트
              </span>
            ) : null}
          </div>
          <div className="mt-1 flex items-center gap-1.5">
            <Badge variant={rsvp.variant} size="sm">
              {displayLabel}
            </Badge>
            {companionCount && companionCount > 0 ? (
              <span className="text-[12px] text-text-tertiary">+{companionCount}명</span>
            ) : null}
          </div>
          {requestPreview ? (
            <p className="mt-1 line-clamp-1 text-[13px] text-text-secondary">
              &ldquo;{requestPreview}&rdquo;
            </p>
          ) : null}
          {memo ? (
            <p className="mt-1 inline-flex items-center gap-1 rounded-md bg-yellow-50 px-2 py-0.5 text-[12px] text-yellow-400">
              <Icon name="memo" size="xs" color="currentColor" decorative /> {memo}
            </p>
          ) : null}
        </div>
        {rightSlot ??
          (onMore ? (
            <IconButton icon="more-horizontal" variant="ghost" size="sm" aria-label="더보기" onClick={(e) => { e.stopPropagation(); onMore?.(); }} />
          ) : null)}
      </div>
    );
  },
);
