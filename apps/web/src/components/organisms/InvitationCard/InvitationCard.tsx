"use client";

import { forwardRef } from "react";
import Image from "next/image";
import { Icon } from "@/components/icons";
import { Badge, type BadgeProps } from "@/components/primitives/Badge";
import { cn } from "@/lib/cn";

export type InvitationCardVariant =
  | "default"
  | "createdByMe"
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
  invited: { label: "참여한", variant: "private" },
  today: { label: "오늘", variant: "today" },
  upcoming: { label: "D-3", variant: "dday" },
  ended: { label: "종료됨", variant: "ended" },
  draft: { label: "임시저장", variant: "noResponse" },
  private: { label: "비공개", variant: "private" },
  noImage: null,
};

export interface InvitationCardProps extends React.HTMLAttributes<HTMLButtonElement> {
  variant?: InvitationCardVariant;
  /** 표지 이미지 URL */
  imageUrl?: string;
  /** 초대장 제목 */
  title: string;
  /** 날짜 텍스트 */
  date?: string;
  /** 장소 텍스트 */
  location?: string;
  /** 본인 RSVP 상태 — 없으면 미응답 */
  rsvpStatus?: "attending" | "maybe" | "declined" | "noResponse";
  /** 참석자 수 (선택) */
  participantsCount?: number;
  /** upcoming variant의 D-day 라벨 (예: "D-3"). 없으면 기본값 "D-?" 표시 */
  ddayLabel?: string;
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
      imageUrl,
      title,
      date,
      location,
      rsvpStatus,
      participantsCount,
      ddayLabel,
      ...props
    },
    ref,
  ) {
    const rawBadge = STATUS_BADGE[variant];
    const statusBadge =
      rawBadge && variant === "upcoming" && ddayLabel
        ? { ...rawBadge, label: ddayLabel }
        : rawBadge;
    const showImage = variant !== "noImage" && imageUrl;

    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          "group flex w-full flex-col gap-3 overflow-hidden rounded-3xl border border-border bg-surface p-3 text-left shadow-xs transition-colors hover:bg-gray-50",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
          className,
        )}
        {...props}
      >
        <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-gray-100">
          {showImage ? (
            <Image src={imageUrl} alt="" fill unoptimized className="object-cover" />
          ) : (
            <div className="flex size-full items-center justify-center">
              <Icon name="ticket" size="xl" color="inactive" decorative />
            </div>
          )}
          {statusBadge ? (
            <span className="absolute right-2 top-2">
              <Badge variant={statusBadge.variant} size="sm">
                {statusBadge.label}
              </Badge>
            </span>
          ) : null}
        </div>
        <div className="flex flex-col gap-1">
          <h3 className="line-clamp-1 text-[16px] font-bold text-text-primary">{title}</h3>
          {date ? (
            <p className="flex items-center gap-1 text-[13px] text-text-secondary">
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
      </button>
    );
  },
);
