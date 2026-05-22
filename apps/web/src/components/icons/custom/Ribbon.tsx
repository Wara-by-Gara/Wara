import { forwardRef } from "react";
import type { LucideProps } from "lucide-react";

export const Ribbon = forwardRef<SVGSVGElement, LucideProps>(function Ribbon(
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
      {/* Center knot */}
      <circle cx="12" cy="12" r="2" />
      {/* Left loop */}
      <path d="M10 11 C5 8 3 9 3 12 C3 15 5 16 10 13" />
      {/* Right loop */}
      <path d="M14 11 C19 8 21 9 21 12 C21 15 19 16 14 13" />
      {/* Left tail */}
      <path d="M11 13 L8 21 L11 19 L12 21" />
      {/* Right tail */}
      <path d="M13 13 L16 21 L13 19 L12 21" />
    </svg>
  );
});
