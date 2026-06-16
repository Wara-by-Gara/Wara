"use client";

import { forwardRef } from "react";
import { Icon } from "@/components/icons";
import type { IconName } from "@/components/icons";
import { cn } from "@/lib/cn";

export type NotificationType =
  | "newRsvp"
  | "rsvpChanged"
  | "newComment"
  | "newPhoto"
  | "invitationUpdated"
  | "eventReminder"
  | "albumOpened"
  | "hostNotice";

const ICON_MAP: Record<NotificationType, { icon: IconName; bg: string; color: string }> = {
  newRsvp: { icon: "user-check", bg: "bg-green-50", color: "text-green-600" },
  rsvpChanged: { icon: "user-x", bg: "bg-yellow-50", color: "text-yellow-400" },
  newComment: { icon: "message-circle", bg: "bg-blue-100", color: "text-blue-500" },
  newPhoto: { icon: "image", bg: "bg-cranberry-10", color: "text-cranberry-60" },
  invitationUpdated: { icon: "edit", bg: "bg-gray-100", color: "text-gray-700" },
  eventReminder: { icon: "calendar-clock", bg: "bg-primary-soft", color: "text-primary" },
  albumOpened: { icon: "camera", bg: "bg-cranberry-10", color: "text-cranberry-60" },
  hostNotice: { icon: "megaphone", bg: "bg-yellow-100", color: "text-yellow-400" },
};

export interface NotificationItemProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "type"> {
  type: NotificationType;
  title: string;
  description?: string;
  /** 상대 시간 텍스트 (예: '3분 전') */
  time: string;
  /** 읽지 않음 — 좌측 작은 dot */
  unread?: boolean;
  onDelete?: () => void;
}

export const NotificationItem = forwardRef<HTMLButtonElement, NotificationItemProps>(
  function NotificationItem(
    { className, type, title, description, time, unread, onDelete, ...props },
    ref,
  ) {
    const meta = ICON_MAP[type];
    return (
      <div className={cn("relative flex items-start", unread && "bg-cranberry-5/60", "rounded-xs")}>
        <button
          ref={ref}
          type="button"
          className={cn(
            "flex flex-1 items-start gap-3 rounded-xs px-4 py-3 text-left hover:bg-gray-50 transition-colors duration-150",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
            className,
          )}
          {...props}
        >
          <span
            className={cn(
              "relative inline-flex size-10 shrink-0 items-center justify-center rounded-xs",
              meta.bg,
              meta.color,
            )}
          >
            <Icon name={meta.icon} size="md" color="currentColor" decorative />
            {unread ? (
              <span
                aria-hidden
                className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-primary ring-2 ring-surface"
              />
            ) : null}
          </span>
          <div className="flex flex-1 flex-col gap-0.5 min-w-0">
            <p className="line-clamp-3 text-[15px] font-semibold text-text">{title}</p>
            {description ? (
              <p className="line-clamp-1 text-[13px] text-text-muted">{description}</p>
            ) : null}
            <p className="text-[12px] text-text-disabled">{time}</p>
          </div>
        </button>
        {onDelete && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            aria-label="알림 삭제"
            className="shrink-0 self-center p-2 text-text-muted hover:text-red-400 transition-colors"
          >
            <Icon name="x" size="sm" color="currentColor" decorative />
          </button>
        )}
      </div>
    );
  },
);
