"use client";

import { forwardRef, type ReactNode } from "react";
import { Icon, type IconName } from "@wara/ui";
import { cn } from "@/lib/cn";

const ICON_MAP: Record<NonNullable<InvitationInfoCardProps["variant"]>, IconName> = {
  datetime: "calendar",
  location: "map-pin",
  host: "crown",
  rsvp: "users",
  album: "image",
  comment: "message-circle",
  notice: "megaphone",
};

const LABEL_MAP: Record<NonNullable<InvitationInfoCardProps["variant"]>, string> = {
  datetime: "일시",
  location: "장소",
  host: "호스트",
  rsvp: "참석 현황",
  album: "앨범",
  comment: "방명록",
  notice: "공지",
};

export interface InvitationInfoCardProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  variant: "datetime" | "location" | "host" | "rsvp" | "album" | "comment" | "notice";
  /** 메인 제목 */
  title: ReactNode;
  /** 일시 variant — 구체 시각 (예: 오후 7시). description과 함께 표시 */
  time?: ReactNode;
  /** 보조 설명 (일시 variant에서는 예상 소요 등) */
  description?: ReactNode;
  /** 우측 상단 배지 */
  badge?: ReactNode;
  /** 우측 화살표 (클릭 가능 카드일 때) */
  chevron?: boolean;
  isDarkBg?: boolean;
}

export const InvitationInfoCard = forwardRef<HTMLDivElement, InvitationInfoCardProps>(
  function InvitationInfoCard(
    { className, variant, title, time, description, badge, chevron, children, isDarkBg, ...props },
    ref,
  ) {
    return (
      <div
        ref={ref}
        className={cn(
          "flex items-start gap-3 rounded-lg border border-border bg-surface p-4",
          className,
        )}
        {...props}
      >
        <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
          <Icon name={ICON_MAP[variant]} size="md" color="currentColor" decorative />
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className={cn("text-[12px] font-medium", isDarkBg ? "text-white/70" : "text-text-disabled")}>{LABEL_MAP[variant]}</p>
            {badge ? <span className="ml-auto">{badge}</span> : null}
          </div>
          <p className={cn("mt-0.5 text-[16px] font-semibold truncate", isDarkBg ? "text-white" : "text-text")}>{title}</p>
          {variant === "datetime" && (time || description) ? (
            <p className={cn("mt-0.5 text-[13px]", isDarkBg ? "text-white/80" : "text-text-muted")}>
              {time ? <span className={cn("font-medium", isDarkBg ? "text-white" : "text-text")}>{time}</span> : null}
              {time && description ? <span className={isDarkBg ? "text-white/50" : "text-text-disabled"}> · </span> : null}
              {description ? <span>{description}</span> : null}
            </p>
          ) : description ? (
            <p className={cn("mt-0.5 text-[13px] truncate", isDarkBg ? "text-white/80" : "text-text-muted")}>{description}</p>
          ) : null}
          {children ? <div className="mt-2">{children}</div> : null}
        </div>
        {chevron ? (
          <Icon name="chevron-right" size="sm" color="inactive" decorative className="mt-1 shrink-0" />
        ) : null}
      </div>
    );
  },
);
