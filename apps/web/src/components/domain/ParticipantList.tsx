"use client";

import { type ReactNode } from "react";
import { Avatar, Badge, Icon, IconButton } from "@wara/ui";
import { cn } from "@/lib/cn";
import type { BadgeTone } from "./InviteCard";

/** WARA RSVP 상태(attending/undecided/absent) + 미응답 */
export type ParticipantRsvp = "attending" | "undecided" | "absent" | "noResponse";

const RSVP_META: Record<ParticipantRsvp, { label: string; tone: BadgeTone }> = {
  attending: { label: "참석", tone: "success" },
  undecided: { label: "미정", tone: "warning" },
  absent: { label: "불참", tone: "danger" },
  noResponse: { label: "미응답", tone: "neutral" },
};

export interface Participant {
  id: string;
  name: string;
  handle?: string;
  avatarUrl?: string;
  status: ParticipantRsvp;
  isHost?: boolean;
  companionCount?: number;
  requestPreview?: string;
  /** 호스트 전용 메모 (있으면 노란 뱃지로 노출) */
  memo?: string;
}

export function ParticipantRow({
  participant,
  onMore,
  onClick,
  rightSlot,
  className,
}: {
  participant: Participant;
  onMore?: () => void;
  /** 행 전체 클릭 (프로필 열기 등) */
  onClick?: () => void;
  rightSlot?: ReactNode;
  className?: string;
}) {
  const { name, handle, avatarUrl, status, isHost, companionCount, requestPreview, memo } =
    participant;
  const rsvp = RSVP_META[status];

  return (
    <div className={cn("flex items-start gap-3 py-3", className)} onClick={onClick}>
      <div className="relative shrink-0">
        <Avatar src={avatarUrl} name={name} size="md" />
        {isHost ? (
          <span
            aria-hidden
            className="absolute -bottom-0.5 -right-0.5 inline-flex size-5 items-center justify-center rounded-full bg-surface text-warning ring-1 ring-border"
          >
            <Icon name="crown" size="xs" color="currentColor" decorative />
          </span>
        ) : null}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate type-body font-semibold text-text">
            {name}
            {handle ? <span className="ml-1 font-normal text-text-muted">@{handle}</span> : null}
          </p>
          {isHost ? (
            <Badge tone="warning" size="sm">호스트</Badge>
          ) : null}
        </div>
        <div className="mt-1 flex items-center gap-1.5">
          <Badge tone={rsvp.tone} size="sm">{rsvp.label}</Badge>
          {companionCount && companionCount > 0 ? (
            <span className="type-caption text-text-muted">+{companionCount}명</span>
          ) : null}
        </div>
        {requestPreview ? (
          <p className="mt-1 line-clamp-1 type-bodySmall text-text-muted">“{requestPreview}”</p>
        ) : null}
        {memo ? (
          <p className="mt-1 inline-flex items-center gap-1 rounded-md bg-warning-soft px-2 py-0.5 type-caption text-warning">
            <Icon name="memo" size="xs" color="currentColor" decorative /> {memo}
          </p>
        ) : null}
      </div>

      {rightSlot ??
        (onMore ? (
          <IconButton
            icon="more-horizontal"
            label="더보기"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onMore();
            }}
          />
        ) : null)}
    </div>
  );
}

export interface ParticipantListProps {
  participants: Participant[];
  onMore?: (id: string) => void;
  className?: string;
}

export function ParticipantList({ participants, onMore, className }: ParticipantListProps) {
  return (
    <ul className={cn("divide-y divide-border", className)}>
      {participants.map((p) => (
        <li key={p.id}>
          <ParticipantRow participant={p} onMore={onMore ? () => onMore(p.id) : undefined} />
        </li>
      ))}
    </ul>
  );
}
