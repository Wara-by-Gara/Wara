import { forwardRef } from "react";
import type { LucideProps } from "lucide-react";

export const KakaoLogo = forwardRef<SVGSVGElement, LucideProps>(
  function KakaoLogo({ size = 24, ...rest }, ref) {
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
        {/* Kakao yellow rounded square */}
        <rect width="24" height="24" rx="6" fill="#FEE500" />
        {/* Speech bubble glyph */}
        <path
          d="M12 6.5C8.13 6.5 5 8.94 5 11.93C5 13.83 6.27 15.5 8.17 16.45L7.45 19.04C7.39 19.26 7.64 19.44 7.83 19.31L10.93 17.29C11.28 17.33 11.64 17.36 12 17.36C15.87 17.36 19 14.92 19 11.93C19 8.94 15.87 6.5 12 6.5Z"
          fill="#181600"
        />
      </svg>
    );
  },
);
