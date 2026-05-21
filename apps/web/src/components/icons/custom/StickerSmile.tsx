import { forwardRef } from "react";
import type { LucideProps } from "lucide-react";

export const StickerSmile = forwardRef<SVGSVGElement, LucideProps>(
  function StickerSmile(
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
        {/* Wavy / cloud-like sticker outline */}
        <path d="M5 8 Q3 8 3 11 Q1.5 13 4 14 Q3.5 17 6.5 17 Q8 19.5 11 18 Q12.5 20 14 18 Q17 19.5 18.5 17 Q21 17 20 14 Q22.5 13 21 11 Q21 8 19 8 Q18 5 15 6 Q13 4 11 6 Q8 5 7 7 Q5.5 7 5 8 Z" />
        {/* Eyes */}
        <circle cx="9.5" cy="11" r="0.8" fill={color as string} />
        <circle cx="14.5" cy="11" r="0.8" fill={color as string} />
        {/* Smile */}
        <path d="M9.5 14 Q12 16 14.5 14" />
      </svg>
    );
  },
);
