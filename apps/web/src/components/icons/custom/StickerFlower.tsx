import { forwardRef } from "react";
import type { LucideProps } from "lucide-react";

export const StickerFlower = forwardRef<SVGSVGElement, LucideProps>(
  function StickerFlower(
    { size = 24, color = "currentColor", strokeWidth = 2, ...rest },
    ref,
  ) {
    return (
      <svg
        ref={ref}
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color as string}
        strokeWidth={strokeWidth as number}
        strokeLinecap="round"
        strokeLinejoin="round"
        xmlns="http://www.w3.org/2000/svg"
        {...rest}
      >
        {/* 5 petals around center */}
        <ellipse cx="12" cy="5" rx="3" ry="4" />
        <ellipse
          cx="18.5"
          cy="9.5"
          rx="3"
          ry="4"
          transform="rotate(72 18.5 9.5)"
        />
        <ellipse
          cx="16"
          cy="17.5"
          rx="3"
          ry="4"
          transform="rotate(144 16 17.5)"
        />
        <ellipse
          cx="8"
          cy="17.5"
          rx="3"
          ry="4"
          transform="rotate(216 8 17.5)"
        />
        <ellipse
          cx="5.5"
          cy="9.5"
          rx="3"
          ry="4"
          transform="rotate(288 5.5 9.5)"
        />
        {/* Center */}
        <circle cx="12" cy="12" r="2" />
      </svg>
    );
  },
);
