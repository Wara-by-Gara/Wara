"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import Image from "next/image";
import { Avatar, AvatarGroup, Badge, Icon } from "@wara/ui";
import { cn } from "@/lib/cn";

export type BadgeTone =
  | "neutral"
  | "accent"
  | "success"
  | "warning"
  | "danger"
  | "info";

export interface InviteCardBadge {
  label: string;
  tone?: BadgeTone;
  solid?: boolean;
}

export interface InviteCardParticipant {
  name?: string;
  src?: string;
}

export interface InviteCardProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "title"> {
  title: string;
  dateText?: string;
  locationText?: string;
  imageUrl?: string;
  layout?: "vertical" | "horizontal";
  /** 상태 배지 (오늘/D-3/지난 모임 등 — 호출 측에서 tone 매핑) */
  badge?: InviteCardBadge;
  /** 배지가 없을 때 제목 위에 표시할 카테고리 eyebrow (예: 추천 이벤트 주제) */
  subject?: string;
  /** 본인 RSVP 배지 */
  rsvp?: InviteCardBadge;
  participants?: InviteCardParticipant[];
  participantTotal?: number;
}

const VISIBLE_AVATARS = 3;

export const InviteCard = forwardRef<HTMLButtonElement, InviteCardProps>(
  function InviteCard(
    {
      className,
      title,
      dateText,
      locationText,
      imageUrl,
      layout = "vertical",
      badge,
      subject,
      rsvp,
      participants,
      participantTotal,
      ...props
    },
    ref,
  ) {
    const horizontal = layout === "horizontal";
    const visible = participants?.slice(0, VISIBLE_AVATARS) ?? [];
    const overflow = Math.max(
      (participantTotal ?? participants?.length ?? 0) - visible.length,
      0,
    );

    const cover = (
      <div
        className={cn(
          "relative shrink-0 overflow-hidden bg-surface-muted",
          horizontal ? "size-[112px] rounded-md" : "aspect-square w-full rounded-lg",
        )}
      >
        {imageUrl ? (
          <Image src={imageUrl} alt="" fill unoptimized className="object-cover" sizes={horizontal ? "112px" : "100vw"} />
        ) : (
          <div className="flex size-full items-center justify-center text-text-disabled">
            <Icon name="image" size={horizontal ? "md" : "xl"} color="currentColor" decorative />
          </div>
        )}
        {!horizontal && badge ? (
          <span className="absolute right-2 top-2">
            <Badge tone={badge.tone} solid={badge.solid ?? true} size="sm">
              {badge.label}
            </Badge>
          </span>
        ) : null}
      </div>
    );

    const meta = (
      <div className={cn("flex min-w-0 flex-col gap-1", horizontal ? "flex-1" : "")}>
        {horizontal && badge ? (
          <Badge tone={badge.tone} size="sm" className="w-fit">
            {badge.label}
          </Badge>
        ) : horizontal && subject ? (
          <span className="type-bodySmall font-medium text-text-muted">{subject}</span>
        ) : null}
        <h3 className="type-cardTitle truncate text-text">{title}</h3>
        {dateText ? (
          <p className="type-bodySmall flex items-center gap-1 text-text-muted">
            <Icon name="calendar" size="xs" color="currentColor" decorative />
            <span className="truncate">{dateText}</span>
          </p>
        ) : null}
        {locationText ? (
          <p className="type-bodySmall flex items-center gap-1 text-text-muted">
            <Icon name="map-pin" size="xs" color="currentColor" decorative />
            <span className="truncate">{locationText}</span>
          </p>
        ) : null}
        {(rsvp || visible.length > 0) && (
          <div className="mt-1 flex items-center gap-2">
            {rsvp ? (
              <Badge tone={rsvp.tone} size="sm">
                {rsvp.label}
              </Badge>
            ) : null}
            {visible.length > 0 ? (
              <AvatarGroup>
                {visible.map((p, i) => (
                  <Avatar key={i} size="xs" src={p.src} name={p.name} />
                ))}
                {overflow > 0 ? <Avatar size="xs" name={`+${overflow}`} /> : null}
              </AvatarGroup>
            ) : null}
          </div>
        )}
      </div>
    );

    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          "group w-full text-left focus-visible:outline-none focus-visible:[box-shadow:var(--focus-ring)]",
          horizontal
            ? "flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-surface-muted"
            : "flex flex-col gap-3 overflow-hidden rounded-xl border border-border bg-surface p-3 shadow-card transition-shadow hover:shadow-hover",
          className,
        )}
        {...props}
      >
        {cover}
        {meta}
      </button>
    );
  },
);
