import { iconSizePx } from "@wara/tokens";

export type IconSize = "xs" | "sm" | "md" | "lg" | "xl" | number;

export const ICON_SIZE_PX: Record<Exclude<IconSize, number>, number> = {
  xs: iconSizePx.xs,
  sm: iconSizePx.sm,
  md: iconSizePx.md,
  lg: iconSizePx.lg,
  xl: iconSizePx.xl,
};

export type IconColor =
  | "default"
  | "muted"
  | "disabled"
  | "danger"
  | "success"
  | "inverse"
  | "currentColor"
  // 레거시 별칭 (드롭인 호환)
  | "inactive"
  | "tertiary"
  | "primary";

/** 시맨틱 컬러 → CSS 변수 (테마 전환 시 자동 반영) */
export const ICON_COLOR_VAR: Record<IconColor, string> = {
  default: "var(--text)",
  muted: "var(--text-muted)",
  disabled: "var(--text-disabled)",
  danger: "var(--danger)",
  success: "var(--success)",
  inverse: "var(--text-inverse)",
  currentColor: "currentColor",
  // 레거시 별칭
  inactive: "var(--text-muted)",
  tertiary: "var(--text-disabled)",
  primary: "var(--primary)",
};

export const resolveIconSize = (size: IconSize): number =>
  typeof size === "number" ? size : ICON_SIZE_PX[size];
