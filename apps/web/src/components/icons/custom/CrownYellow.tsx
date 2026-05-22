import { forwardRef } from "react";
import type { LucideProps } from "lucide-react";

const CROWN_YELLOW = "#FFD43B";

export const CrownYellow = forwardRef<SVGSVGElement, LucideProps>(
  function CrownYellow({ size = 24, ...rest }, ref) {
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
        <path
          d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z"
          fill={CROWN_YELLOW}
        />
        <rect x="5" y="20" width="14" height="2" rx="0.5" fill={CROWN_YELLOW} />
      </svg>
    );
  },
);

CrownYellow.displayName = "CrownYellow";
