"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Icon, IconButton, type IconName } from "@wara/ui";
import { cn } from "@/lib/cn";
import type { BadgeTone } from "./InviteCard";

export type NotificationType =
  | "newRsvp"
  | "rsvpChanged"
  | "newComment"
  | "newPhoto"
  | "invitationUpdated"
  | "eventReminder"
  | "albumOpened"
  | "hostNotice";

const TYPE_META: Record<NotificationType, { icon: IconName; tone: BadgeTone }> = {
  newRsvp: { icon: "user-check", tone: "success" },
  rsvpChanged: { icon: "user-x", tone: "warning" },
  newComment: { icon: "message-circle", tone: "info" },
  newPhoto: { icon: "image", tone: "accent" },
  invitationUpdated: { icon: "edit", tone: "neutral" },
  eventReminder: { icon: "calendar-clock", tone: "accent" },
  albumOpened: { icon: "camera", tone: "accent" },
  hostNotice: { icon: "megaphone", tone: "warning" },
};

const TONE_CLASS: Record<BadgeTone, string> = {
  neutral: "bg-surface-muted text-text-muted",
  accent: "bg-accent-soft text-accent",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  info: "bg-info-soft text-info",
};

export interface NotificationItemProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type"> {
  type: NotificationType;
  title: string;
  description?: string;
  /** 상대 시간 (예: '3분 전') */
  time: string;
  unread?: boolean;
  onDelete?: () => void;
}

export const NotificationItem = forwardRef<HTMLButtonElement, NotificationItemProps>(
  function NotificationItem(
    { className, type, title, description, time, unread, onDelete, ...props },
    ref,
  ) {
    const meta = TYPE_META[type];
    return (
      <div className={cn("relative flex items-center", unread && "bg-accent-soft/40")}>
        <button
          ref={ref}
          type="button"
          className={cn(
            "flex flex-1 items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-muted",
            "focus-visible:outline-none focus-visible:[box-shadow:var(--focus-ring)]",
            className,
          )}
          {...props}
        >
          <span
            className={cn(
              "relative inline-flex size-10 shrink-0 items-center justify-center rounded-lg",
              TONE_CLASS[meta.tone],
            )}
          >
            <Icon name={meta.icon} size="md" color="currentColor" decorative />
            {unread ? (
              <span
                aria-hidden
                className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-accent ring-2 ring-surface"
              />
            ) : null}
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <p className="line-clamp-2 type-bodySmall font-semibold text-text">{title}</p>
            {description ? (
              <p className="line-clamp-1 type-bodySmall text-text-muted">{description}</p>
            ) : null}
            <p className="type-caption text-text-muted">{time}</p>
          </div>
        </button>
        {onDelete ? (
          <IconButton
            icon="close"
            label="알림 삭제"
            size="sm"
            className="mr-1 shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          />
        ) : null}
      </div>
    );
  },
);
