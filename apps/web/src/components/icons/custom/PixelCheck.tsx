import { forwardRef } from "react";
import type { LucideProps } from "lucide-react";

export const PixelCheck = forwardRef<SVGSVGElement, LucideProps>(
  function PixelCheck({ size = 24, color = "currentColor", ...rest }, ref) {
    return (
      <svg
        ref={ref}
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill={color as string}
        xmlns="http://www.w3.org/2000/svg"
        {...rest}
      >
        {/* 4px pixel grid check mark */}
        <rect x="18" y="4" width="4" height="4" />
        <rect x="14" y="8" width="4" height="4" />
        <rect x="10" y="12" width="4" height="4" />
        <rect x="6" y="16" width="4" height="4" />
        <rect x="2" y="12" width="4" height="4" />
      </svg>
    );
  },
);
