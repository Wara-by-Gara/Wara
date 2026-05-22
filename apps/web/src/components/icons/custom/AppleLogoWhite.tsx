import { forwardRef } from "react";
import type { LucideProps } from "lucide-react";

/** Apple 로고 (밝은/검정 배경용) */
export const AppleLogoWhite = forwardRef<SVGSVGElement, LucideProps>(
  function AppleLogoWhite({ size = 24, ...rest }, ref) {
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
          d="M17.05 12.04C17.03 9.45 19.16 8.18 19.25 8.12C18.05 6.36 16.18 6.12 15.51 6.1C13.93 5.93 12.41 7.04 11.6 7.04C10.79 7.04 9.54 6.11 8.21 6.14C6.49 6.17 4.89 7.15 4.01 8.7C2.21 11.83 3.56 16.47 5.32 19.02C6.18 20.27 7.21 21.67 8.55 21.62C9.85 21.57 10.34 20.79 11.92 20.79C13.49 20.79 13.93 21.62 15.3 21.59C16.71 21.57 17.6 20.32 18.45 19.05C19.45 17.6 19.86 16.17 19.88 16.1C19.85 16.09 17.07 15.02 17.05 12.04ZM14.5 4.41C15.21 3.55 15.7 2.36 15.56 1.17C14.54 1.22 13.3 1.86 12.56 2.71C11.9 3.46 11.31 4.69 11.46 5.84C12.6 5.93 13.78 5.27 14.5 4.41Z"
          fill="#FFFFFF"
        />
      </svg>
    );
  },
);
