import { forwardRef } from "react";
import type { LucideProps } from "lucide-react";

export const Sparkle = forwardRef<SVGSVGElement, LucideProps>(function Sparkle(
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
      {/* Big four-point sparkle */}
      <path d="M12 4 L13.2 10.8 L20 12 L13.2 13.2 L12 20 L10.8 13.2 L4 12 L10.8 10.8 Z" />
      {/* Small sparkle top-right */}
      <path d="M19 4 L19.5 6 L21.5 6.5 L19.5 7 L19 9 L18.5 7 L16.5 6.5 L18.5 6 Z" />
      {/* Small sparkle bottom-left */}
      <path d="M5 17 L5.4 18.6 L7 19 L5.4 19.4 L5 21 L4.6 19.4 L3 19 L4.6 18.6 Z" />
    </svg>
  );
});
