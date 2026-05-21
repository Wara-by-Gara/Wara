import { forwardRef } from "react";
import type { LucideProps } from "lucide-react";

const HEART_PATTERN = [
  "00110001100",
  "01111011110",
  "11111111111",
  "11111111111",
  "01111111110",
  "00111111100",
  "00011111000",
  "00001110000",
  "00000100000",
];

export const PixelHeart = forwardRef<SVGSVGElement, LucideProps>(
  function PixelHeart({ size = 24, color = "currentColor", ...rest }, ref) {
    const cellSize = 2;
    const offsetX = 1; // 11 * 2 = 22 → 좌우 1px 여백
    const offsetY = 3; // 9 * 2 = 18 → 상하 3px 여백

    return (
      <svg
        ref={ref}
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill={color as string}
        xmlns="http://www.w3.org/2000/svg"
        shapeRendering="crispEdges"
        {...rest}
      >
        {HEART_PATTERN.flatMap((row, y) =>
          row.split("").map((cell, x) =>
            cell === "1" ? (
              <rect
                key={`${x}-${y}`}
                x={offsetX + x * cellSize}
                y={offsetY + y * cellSize}
                width={cellSize}
                height={cellSize}
              />
            ) : null,
          ),
        )}
      </svg>
    );
  },
);

PixelHeart.displayName = "PixelHeart";