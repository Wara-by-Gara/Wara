import { forwardRef } from "react";
import type { LucideProps } from "lucide-react";

export const PartyPopper = forwardRef<SVGSVGElement, LucideProps>(
  function PartyPopper(
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
        {/* Cone */}
        <path d="M3 21 L8 9 L15 16 Z" />
        {/* Confetti pieces */}
        <path d="M11 5 L11 7" />
        <path d="M15 3 L16 5" />
        <path d="M19 6 L18 8" />
        <path d="M21 10 L19 11" />
        <path d="M14 8 L13 10" />
        <circle cx="18" cy="13" r="1" fill={color as string} />
        <circle cx="20" cy="17" r="1" fill={color as string} />
        <circle cx="11" cy="11" r="0.8" fill={color as string} />
        <circle cx="15" cy="6.5" r="0.8" fill={color as string} />
      </svg>
    );
  },
);
