import { forwardRef } from "react";
import type { LucideProps } from "lucide-react";

export const PixelAirplane = forwardRef<SVGSVGElement, LucideProps>(
  function PixelAirplane({ size = 24, color = "currentColor", ...rest }, ref) {
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
        {/* 2px pixel-grid paper airplane (oblique view) — 12×12 cells.
            좌측 상단에서 우측 하단으로 흐르는 종이비행기.
            큰 다이아몬드 본체 + 우상단 V 꼬리 + 본체 아래 꼬리선.

            Row 0:  . . . . . X X X . . . .
            Row 1:  . . . . X X . X X . . .
            Row 2:  . . . X X . . . X X . .
            Row 3:  . . X X . . . . . X X .
            Row 4:  . X X . X . . . . . X .
            Row 5:  X X . X X X X X X X . .
            Row 6:  X X X X X X X X . . . .
            Row 7:  . X X X X . . . . . . .
            Row 8:  . . . X . . . . . . . .
            Row 9:  . . . X . . . . . . . .
            Row 10: . . . X . . . . . . . .
            Row 11: . . . . . . . . . . . .  */}

        {/* Row 0 — V tail tip */}
        <rect x="10" y="0" width="2" height="2" />
        <rect x="12" y="0" width="2" height="2" />
        <rect x="14" y="0" width="2" height="2" />
        {/* Row 1 */}
        <rect x="8" y="2" width="2" height="2" />
        <rect x="10" y="2" width="2" height="2" />
        <rect x="14" y="2" width="2" height="2" />
        <rect x="16" y="2" width="2" height="2" />
        {/* Row 2 */}
        <rect x="6" y="4" width="2" height="2" />
        <rect x="8" y="4" width="2" height="2" />
        <rect x="16" y="4" width="2" height="2" />
        <rect x="18" y="4" width="2" height="2" />
        {/* Row 3 */}
        <rect x="4" y="6" width="2" height="2" />
        <rect x="6" y="6" width="2" height="2" />
        <rect x="18" y="6" width="2" height="2" />
        <rect x="20" y="6" width="2" height="2" />
        {/* Row 4 */}
        <rect x="2" y="8" width="2" height="2" />
        <rect x="4" y="8" width="2" height="2" />
        <rect x="8" y="8" width="2" height="2" />
        <rect x="20" y="8" width="2" height="2" />
        {/* Row 5 — long horizontal fold */}
        <rect x="0" y="10" width="2" height="2" />
        <rect x="2" y="10" width="2" height="2" />
        <rect x="6" y="10" width="2" height="2" />
        <rect x="8" y="10" width="2" height="2" />
        <rect x="10" y="10" width="2" height="2" />
        <rect x="12" y="10" width="2" height="2" />
        <rect x="14" y="10" width="2" height="2" />
        <rect x="16" y="10" width="2" height="2" />
        <rect x="18" y="10" width="2" height="2" />
        {/* Row 6 — solid lower body */}
        <rect x="0" y="12" width="2" height="2" />
        <rect x="2" y="12" width="2" height="2" />
        <rect x="4" y="12" width="2" height="2" />
        <rect x="6" y="12" width="2" height="2" />
        <rect x="8" y="12" width="2" height="2" />
        <rect x="10" y="12" width="2" height="2" />
        <rect x="12" y="12" width="2" height="2" />
        <rect x="14" y="12" width="2" height="2" />
        {/* Row 7 — body taper */}
        <rect x="2" y="14" width="2" height="2" />
        <rect x="4" y="14" width="2" height="2" />
        <rect x="6" y="14" width="2" height="2" />
        <rect x="8" y="14" width="2" height="2" />
        {/* Row 8-10 — vertical tail */}
        <rect x="6" y="16" width="2" height="2" />
        <rect x="6" y="18" width="2" height="2" />
        <rect x="6" y="20" width="2" height="2" />
      </svg>
    );
  },
);
