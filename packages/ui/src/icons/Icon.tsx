import type { CSSProperties } from "react";
import { ICONS, type IconName } from "./registry.ts";
import {
  ICON_COLOR_VAR,
  resolveIconSize,
  type IconColor,
  type IconSize,
} from "./types.ts";

export interface IconProps {
  name: IconName;
  size?: IconSize;
  color?: IconColor;
  /** lucide stroke 두께 (기본 2) */
  strokeWidth?: number;
  /** 장식용(스크린리더 무시). 의미 있는 아이콘이면 aria-label 제공 */
  decorative?: boolean;
  "aria-label"?: string;
  className?: string;
  style?: CSSProperties;
}

export function Icon({
  name,
  size = "md",
  color = "default",
  strokeWidth = 2,
  decorative = false,
  "aria-label": ariaLabel,
  className,
  style,
}: IconProps) {
  const px = resolveIconSize(size);
  const Cmp = ICONS[name];
  const a11y = decorative
    ? ({ "aria-hidden": true } as const)
    : ({ role: "img", "aria-label": ariaLabel ?? name } as const);

  return (
    <Cmp
      size={px}
      color={ICON_COLOR_VAR[color]}
      strokeWidth={strokeWidth}
      className={className}
      style={style}
      focusable={false}
      {...a11y}
    />
  );
}
