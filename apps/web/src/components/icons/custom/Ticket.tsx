import { forwardRef } from "react";
import type { LucideProps } from "lucide-react";

export const Ticket = forwardRef<SVGSVGElement, LucideProps>(function Ticket(
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
      {/* Ticket outline with notches */}
      <path d="M3 7 V10 A2 2 0 0 1 3 14 V17 A2 2 0 0 0 5 19 H19 A2 2 0 0 0 21 17 V14 A2 2 0 0 1 21 10 V7 A2 2 0 0 0 19 5 H5 A2 2 0 0 0 3 7 Z" />
      {/* Perforated divider */}
      <path d="M12 7 V9" />
      <path d="M12 11.5 V12.5" />
      <path d="M12 15 V17" />
    </svg>
  );
});
