"use client";

import { cn } from "@/lib/cn";
import { Icon } from "@/components/icons";
import { InvitationCover } from "@/components/organisms/InvitationCover";
import { InvitationAnimation } from "../InvitationAnimation";
import type { AnimationId, RsvpOption, RsvpType } from "../constants";

export interface InvitationPreviewProps {
  open: boolean;
  onClose: () => void;
  title: string;
  /** 제목 폰트 유틸 클래스 (예: font-pretendard) */
  fontClass: string;
  /** 배경 클래스 (예: bg-invite-pastel, bg-white) */
  bgClass: string;
  coverImageUrl?: string;
  coverGifUrl?: string;
  description?: string;
  dateLabel?: string;
  timeLabel?: string;
  placeName?: string;
  rsvp: Record<RsvpType, RsvpOption>;
  animation: AnimationId;
}

export function InvitationPreview({
  open,
  onClose,
  title,
  fontClass,
  bgClass,
  coverImageUrl,
  coverGifUrl,
  description,
  dateLabel,
  timeLabel,
  placeName,
  rsvp,
  animation,
}: InvitationPreviewProps) {
  if (!open) return null;

  const hasCover = !!coverImageUrl || !!coverGifUrl;

  return (
    <div
      className="fixed inset-0 z-[100] flex justify-center bg-black/50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="초대장 미리보기"
    >
      <div
        className={cn(
          "relative flex h-svh w-full max-w-md flex-col overflow-hidden font-pretendard",
          bgClass,
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <InvitationAnimation effect={animation} className="z-[1]" />

        <button
          type="button"
          onClick={onClose}
          aria-label="미리보기 닫기"
          className="absolute right-3 top-3 z-20 inline-flex size-9 items-center justify-center rounded-full bg-black/40 text-white"
        >
          <Icon name="x" size="sm" color="currentColor" decorative />
        </button>

        <span className="absolute left-1/2 top-3 z-20 -translate-x-1/2 rounded-full bg-black/35 px-3 py-1 text-[12px] font-semibold text-white">
          미리보기
        </span>

        <div className="relative z-[2] flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-5 pb-8 pt-14">
          <h1 className={cn("text-center text-[30px] font-extrabold leading-normal text-text-primary line-clamp-3", fontClass)}>
            {title || "초대장 제목"}
          </h1>

          <InvitationCover
            variant={hasCover ? "image" : "color"}
            imageUrl={coverImageUrl}
            gifUrl={coverGifUrl}
            backgroundClass={bgClass}
            hideBottomGradient
            fitToImage
          />

          {description ? (
            <p className={cn("whitespace-pre-wrap text-[14px] leading-relaxed text-text-secondary", fontClass)}>
              {description}
            </p>
          ) : null}

          {(dateLabel || placeName) && (
            <div className="flex flex-col gap-2.5 rounded-2xl border border-border bg-surface/70 px-4 py-3.5">
              {dateLabel ? (
                <div className="flex items-center gap-2.5">
                  <Icon name="calendar" size="sm" color="primary" decorative />
                  <span className="text-[14px] text-text-primary">
                    {dateLabel}
                    {timeLabel ? ` · ${timeLabel}` : ""}
                  </span>
                </div>
              ) : null}
              {placeName ? (
                <div className="flex items-center gap-2.5">
                  <Icon name="map-pin" size="sm" color="primary" decorative />
                  <span className="text-[14px] text-text-primary">{placeName}</span>
                </div>
              ) : null}
            </div>
          )}

          <div className="mt-auto grid grid-cols-3 gap-2 pt-2">
            {(["attending", "maybe", "declined"] as RsvpType[]).map((type) => (
              <div
                key={type}
                className="flex flex-col items-center gap-1.5 rounded-2xl border border-border bg-surface/80 px-3 py-3"
              >
                <span className="text-[28px] leading-none">{rsvp[type].emoji}</span>
                <span className="text-[13px] text-text-secondary">{rsvp[type].label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
