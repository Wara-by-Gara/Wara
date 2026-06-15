"use client";

import { forwardRef, useState } from "react";
import Image from "next/image";
import { Icon } from "@/components/icons";
import { Avatar, AvatarGroup } from "@/components/primitives/Avatar";
import { Badge, type BadgeProps } from "@/components/primitives/Badge";
import type { InvitationParticipantAvatar } from "@/lib/api/invitations";
import { cn } from "@/lib/cn";

const PARTICIPANT_AVATAR_VISIBLE_MAX = 3;

export type InvitationCardVariant =
  | "default"
  | "createdByMe"
  | "hosting"
  | "invited"
  | "today"
  | "upcoming"
  | "ended"
  | "draft"
  | "private"
  | "noImage";

const STATUS_BADGE: Record<
  InvitationCardVariant,
  { label: string; variant: BadgeProps["variant"] } | null
> = {
  default: null,
  createdByMe: { label: "내가 만든", variant: "host" },
  hosting: { label: "호스팅", variant: "host" },
  invited: { label: "참여한", variant: "private" },
  today: { label: "오늘", variant: "today" },
  upcoming: { label: "D-3", variant: "dday" },
  ended: { label: "지난 모임", variant: "ended" },
  draft: { label: "임시저장", variant: "noResponse" },
  private: { label: "비공개", variant: "private" },
  noImage: null,
};

const STATUS_BADGE_HORIZONTAL: Partial<Record<NonNullable<BadgeProps["variant"]>, string>> = {
  dday: "bg-blue-50 text-blue-700 font-semibold",
  today: "bg-cranberry-10 text-cranberry-60 font-semibold",
};

const STATUS_BADGE_GLASS: Partial<Record<NonNullable<BadgeProps["variant"]>, string>> = {
  dday:
    "border border-white/35 !bg-blue-600/80 !text-white font-semibold shadow-sm backdrop-blur-md [text-shadow:0_1px_2px_rgba(0,0,0,0.25)]",
  today:
    "border border-white/35 !bg-cranberry-60/80 !text-white font-semibold shadow-sm backdrop-blur-md [text-shadow:0_1px_2px_rgba(0,0,0,0.25)]",
  ended:
    "border border-white/20 !bg-gray-800/80 !text-gray-100 font-semibold shadow-sm backdrop-blur-md [text-shadow:0_1px_2px_rgba(0,0,0,0.35)]",
  host:
    "border border-white/35 !bg-amber-600/85 !text-white font-semibold shadow-sm backdrop-blur-md [text-shadow:0_1px_2px_rgba(0,0,0,0.25)]",
};

export interface InvitationCardProps extends React.HTMLAttributes<HTMLButtonElement> {
  variant?: InvitationCardVariant;
  layout?: "vertical" | "horizontal";
  /** 표지 이미지 URL */
  imageUrl?: string;
  /** 주제 라벨 (가로 카드, 없으면 생략) */
  subject?: string;
  /** 초대장 제목 */
  title: string;
  /** 날짜 텍스트 */
  date?: string;
  /** 장소 텍스트 */
  location?: string;
  /** 날짜 텍스트에 추가할 클래스 */
  dateClassName?: string;
  /** 본인 RSVP 상태 — 없으면 미응답 */
  rsvpStatus?: "attending" | "maybe" | "declined" | "noResponse";
  /** 참석자 수 (선택) */
  participantsCount?: number;
  /** upcoming variant의 D-day 라벨 (예: "D-3"). 없으면 기본값 "D-?" 표시 */
  ddayLabel?: string;
  /** 참가자 아바타 (호스트가 맨 앞) */
  participantAvatars?: InvitationParticipantAvatar[];
  participantTotal?: number;
}

const RSVP_LABEL: Record<NonNullable<InvitationCardProps["rsvpStatus"]>, { label: string; variant: BadgeProps["variant"] }> = {
  attending: { label: "참석", variant: "attending" },
  maybe: { label: "미정", variant: "maybe" },
  declined: { label: "불참", variant: "declined" },
  noResponse: { label: "미응답", variant: "noResponse" },
};

export const InvitationCard = forwardRef<HTMLButtonElement, InvitationCardProps>(
  function InvitationCard(
    {
      className,
      variant = "default",
      layout = "vertical",
      imageUrl,
      subject,
      title,
      date,
      dateClassName,
      location,
      rsvpStatus,
      participantsCount,
      ddayLabel,
      participantAvatars,
      participantTotal,
      ...props
    },
    ref,
  ) {
    const [imgError, setImgError] = useState(false);
    const rawBadge = STATUS_BADGE[variant];
    const statusBadge =
      rawBadge && variant === "upcoming" && ddayLabel
        ? { ...rawBadge, label: ddayLabel }
        : rawBadge;
    const showImage = variant !== "noImage" && imageUrl && !imgError;
    const isHorizontal = layout === "horizontal";
    const visibleParticipants = participantAvatars?.slice(0, PARTICIPANT_AVATAR_VISIBLE_MAX) ?? [];
    const participantOverflow = Math.max(
      (participantTotal ?? participantAvatars?.length ?? 0) - visibleParticipants.length,
      0,
    );

    const imageBlock = (
      <div
        className={cn(
          "relative shrink-0 overflow-hidden bg-gray-100",
          isHorizontal ? "size-[120px] rounded-sm" : "aspect-square w-full rounded-lg",
        )}
      >
        {showImage ? (
          <Image
            src={imageUrl}
            alt=""
            fill
            unoptimized
            className="object-cover"
            sizes={isHorizontal ? "120px" : "100vw"}
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex size-full items-center justify-center">
            <Icon name="ticket" size={isHorizontal ? "md" : "xl"} color="inactive" decorative />
          </div>
        )}
        {!isHorizontal && statusBadge ? (
          <span className="absolute right-2 top-2">
            <Badge
              variant={statusBadge.variant}
              size="sm"
              className={statusBadge.variant ? STATUS_BADGE_GLASS[statusBadge.variant] : undefined}
            >
              {statusBadge.label}
            </Badge>
          </span>
        ) : null}
      </div>
    );

    const textBlock = isHorizontal ? (
      <div className="home-card-text min-w-0 flex-1">
        {statusBadge ? (
          <Badge
            variant={statusBadge.variant}
            size="sm"
            className={cn("w-fit", statusBadge.variant ? STATUS_BADGE_HORIZONTAL[statusBadge.variant] : undefined)}
          >
            {statusBadge.label}
          </Badge>
        ) : subject ? (
          <span className="type-card-eyebrow">{subject}</span>
        ) : null}
        <h3 className="type-card-title truncate">{title}</h3>
        {date ? (
          <p className={cn("home-meta-row type-meta", dateClassName)}>
            <Icon name="clock" size="xs" color="inactive" decorative />
            <span className="truncate">{date}</span>
          </p>
        ) : null}
        <p className="home-meta-row type-meta-muted">
          <Icon name="map-pin" size="xs" color="inactive" decorative />
          <span className="truncate">{location?.trim() || "미정"}</span>
        </p>
        {visibleParticipants.length > 0 ? (
          <AvatarGroup variant="separated" className="mt-1.5">
            {visibleParticipants.map((p) => (
              <Avatar
                key={p.id}
                size="xs"
                src={p.avatarUrl ?? undefined}
                alt={p.name ?? undefined}
                name={p.name ?? undefined}
                host={p.isHost}
              />
            ))}
            {participantOverflow > 0 ? (
              <Avatar
                size="xs"
                initial={`+${participantOverflow}`}
                className="bg-cranberry-10 text-[10px] font-bold text-cranberry-60"
              />
            ) : null}
          </AvatarGroup>
        ) : null}
      </div>
    ) : (
      <div className="flex flex-col gap-1">
        <h3 className="line-clamp-1 text-[16px] font-semibold text-text-primary">{title}</h3>
        {date ? (
          <p className={cn("flex items-center gap-1 text-[13px] text-text-secondary", dateClassName)}>
            <Icon name="calendar" size="xs" color="inactive" decorative /> {date}
          </p>
        ) : null}
        {location ? (
          <p className="flex items-center gap-1 text-[13px] text-text-secondary">
            <Icon name="map-pin" size="xs" color="inactive" decorative />
            <span className="line-clamp-1">{location}</span>
          </p>
        ) : null}
        {(rsvpStatus || participantsCount !== undefined) ? (
          <div className="mt-1 flex items-center gap-1.5">
            {rsvpStatus ? (
              <Badge size="sm" variant={RSVP_LABEL[rsvpStatus].variant}>
                {RSVP_LABEL[rsvpStatus].label}
              </Badge>
            ) : null}
            {participantsCount !== undefined ? (
              <span className="text-[12px] text-text-tertiary">
                · {participantsCount}명 참석
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
    );

    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          "group w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
          isHorizontal
            ? "home-list-item-y flex items-center gap-3 transition-colors duration-150 hover:bg-gray-50/80"
            : "flex flex-col gap-3 overflow-hidden rounded-lg border border-border bg-surface p-3 shadow-xs transition-shadow duration-200 hover:shadow-sm",
          className,
        )}
        {...props}
      >
        {imageBlock}
        {textBlock}
      </button>
    );
  },
);
