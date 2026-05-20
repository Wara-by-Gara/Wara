import { forwardRef } from "react";
import type { Ref } from "react";
import { ICON_REGISTRY, isBrandIcon } from "./registry";
import {
  ICON_COLOR_MAP,
  ICON_SIZE_MAP,
  type IconColor,
  type IconProps,
  type IconSize,
} from "./types";

const resolveSize = (size: IconSize): number =>
  typeof size === "number" ? size : ICON_SIZE_MAP[size];

const resolveColor = (color: IconColor): string => ICON_COLOR_MAP[color];

export const Icon = forwardRef<SVGSVGElement, IconProps>(function Icon(
  {
    name,
    size = "md",
    color = "default",
    strokeWidth = 2,
    decorative = false,
    "aria-label": ariaLabel,
    ...rest
  },
  ref: Ref<SVGSVGElement>,
) {
  const Component = ICON_REGISTRY[name];
  const pixelSize = resolveSize(size);
  const isBrand = isBrandIcon(name);

  return (
    <Component
      ref={ref}
      size={pixelSize}
      color={isBrand ? undefined : resolveColor(color)}
      strokeWidth={isBrand ? undefined : strokeWidth}
      aria-hidden={decorative ? true : undefined}
      aria-label={decorative ? undefined : (ariaLabel ?? name)}
      role={decorative ? "presentation" : "img"}
      focusable={false}
      {...rest}
    />
  );
});
