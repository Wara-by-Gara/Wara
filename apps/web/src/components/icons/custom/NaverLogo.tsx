import { forwardRef } from "react";
import type { LucideProps } from "lucide-react";

export const NaverLogo = forwardRef<SVGSVGElement, LucideProps>(
  function NaverLogo({ size = 24, ...rest }, ref) {
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
        {/* Naver green rounded square */}
        <rect width="24" height="24" rx="4" fill="#03C75A" />
        {/* N glyph */}
        <path d="M13.45 12.42L10.36 8H7.5V16H10.55V11.58L13.64 16H16.5V8H13.45V12.42Z" fill="#FFFFFF" />
      </svg>
    );
  },
);
