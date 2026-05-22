import type { SVGProps } from "react";

export type IconSize = "xs" | "sm" | "md" | "lg" | "xl" | number;

export type IconColor =
  | "default"
  | "primary"
  | "inactive"
  | "danger"
  | "success"
  | "inverse"
  | "currentColor";

export const ICON_SIZE_MAP: Record<Exclude<IconSize, number>, number> = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
};

export const ICON_COLOR_MAP: Record<IconColor, string> = {
  default: "var(--color-icon-default)",
  primary: "var(--color-icon-primary)",
  inactive: "var(--color-icon-inactive)",
  danger: "var(--color-icon-danger)",
  success: "var(--color-success)",
  inverse: "var(--color-icon-inverse)",
  currentColor: "currentColor",
};

export type IconName =
  // Navigation
  | "home"
  | "invitation"
  | "plus"
  | "bell"
  | "user"
  | "settings"
  | "chevron-left"
  | "chevron-right"
  | "chevron-down"
  | "menu"
  | "close"
  | "more-horizontal"
  | "search"
  | "filter"
  | "sort"
  // Invitation
  | "calendar"
  | "clock"
  | "map-pin"
  | "navigation"
  | "link"
  | "copy"
  | "share"
  | "qrcode"
  | "edit"
  | "trash"
  | "save"
  | "eye"
  | "eye-off"
  | "lock"
  | "unlock"
  | "image"
  | "palette"
  | "sparkles"
  // RSVP / Attendance
  | "check"
  | "help-circle"
  | "x"
  | "users"
  | "user-plus"
  | "user-check"
  | "user-x"
  | "hourglass"
  | "crown"
  | "crown-yellow"
  | "badge-check"
  | "alert-circle"
  | "plus-circle"
  | "minus-circle"
  | "minus"
  // Participants
  | "user-round"
  | "users-round"
  | "message-square"
  | "clipboard-list"
  | "memo"
  | "mail"
  | "phone"
  | "shield"
  | "download"
  // Map / Location
  | "map"
  | "locate"
  | "route"
  | "external-link"
  | "building"
  | "globe"
  | "wifi"
  | "alert-triangle"
  // Album / Photo
  | "camera"
  | "images"
  | "upload"
  | "heart"
  | "flag"
  | "rotate-cw"
  | "zoom-in"
  // Comments
  | "message-circle"
  | "send"
  | "reply"
  | "smile"
  // Notifications
  | "bell-dot"
  | "check-circle"
  | "x-circle"
  | "info"
  | "calendar-clock"
  | "megaphone"
  // Auth / Account
  | "log-out"
  | "user-round-cog"
  | "shield-check"
  | "file-text"
  | "lock-keyhole"
  // Wara decorative
  | "pixel-airplane"
  | "pixel-heart"
  | "sparkle"
  | "ribbon"
  | "sticker-flower"
  | "sticker-smile"
  | "retro-camera"
  | "ticket"
  | "party-popper"
  | "mini-cloud"
  | "mini-bow"
  | "pixel-check"
  // Social
  | "kakao-logo"
  | "naver-logo"
  | "apple-logo"
  | "apple-logo-white"
  | "google-logo";

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, "color"> {
  name: IconName;
  size?: IconSize;
  color?: IconColor;
  strokeWidth?: number;
  decorative?: boolean;
}
