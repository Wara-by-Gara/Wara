import { forwardRef } from "react";
import type { LucideProps } from "lucide-react";

export const InstagramLogo = forwardRef<SVGSVGElement, LucideProps>(
  function InstagramLogo({ size = 24, ...rest }, ref) {
    return (
      <svg
        ref={ref}
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        {...rest}
      >
        <rect x="4" y="4" width="16" height="16" rx="5" stroke="white" strokeWidth="1.5" />
        <circle cx="12" cy="12" r="3.5" stroke="white" strokeWidth="1.5" />
        <circle cx="16.5" cy="7.5" r="1" fill="white" />
      </svg>
    );
  },
);
