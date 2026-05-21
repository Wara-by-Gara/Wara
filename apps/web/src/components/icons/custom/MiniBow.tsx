import { forwardRef } from "react";
import type { LucideProps } from "lucide-react";

export const MiniBow = forwardRef<SVGSVGElement, LucideProps>(function MiniBow(
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
      {/* Compact decorative bow */}
      <path d="M11 12 L4 7 V17 Z" />
      <path d="M13 12 L20 7 V17 Z" />
      {/* Center knot */}
      <rect x="10.5" y="10" width="3" height="4" rx="0.6" />
    </svg>
  );
});
