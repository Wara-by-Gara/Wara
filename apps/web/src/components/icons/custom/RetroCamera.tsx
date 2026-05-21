import { forwardRef } from "react";
import type { LucideProps } from "lucide-react";

export const RetroCamera = forwardRef<SVGSVGElement, LucideProps>(
  function RetroCamera(
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
        {/* Camera body */}
        <rect x="2" y="7" width="20" height="14" rx="2" />
        {/* Top viewfinder bump */}
        <path d="M8 7 L9 4 H15 L16 7" />
        {/* Lens outer */}
        <circle cx="12" cy="14" r="4.5" />
        {/* Lens inner */}
        <circle cx="12" cy="14" r="2" />
        {/* Flash dot */}
        <circle cx="18.5" cy="10" r="0.8" fill={color as string} />
      </svg>
    );
  },
);
