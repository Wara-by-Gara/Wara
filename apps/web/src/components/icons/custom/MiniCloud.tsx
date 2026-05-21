import { forwardRef } from "react";
import type { LucideProps } from "lucide-react";

export const MiniCloud = forwardRef<SVGSVGElement, LucideProps>(
  function MiniCloud(
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
        {/* Soft pastel cloud */}
        <path d="M6 16 Q3 16 3 13 Q3 10 6 10 Q6 7 9.5 7 Q12 5 14.5 7 Q18 7 18 10 Q21 10 21 13 Q21 16 18 16 Z" />
      </svg>
    );
  },
);
