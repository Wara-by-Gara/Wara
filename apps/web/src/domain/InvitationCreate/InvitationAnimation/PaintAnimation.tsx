"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

/**
 * 페인트 splash 애니메이션:
 * - 무작위 위치/색의 물감이 위에서 떨어져 → 바닥에 splat (퍼짐) → 머무름 → 사라짐
 * - 사이클 끝나면 새 위치·새 색으로 재생성 (진짜 무작위)
 * - mix-blend-mode: multiply로 색상 블렌딩 (페인트끼리 겹치면 잉크처럼 어두워짐)
 */

const COLORS = [
  "#ff4757",
  "#feca57",
  "#48dbfb",
  "#1dd1a1",
  "#5f27cd",
  "#ff9ff3",
  "#ee5253",
  "#10ac84",
  "#fd79a8",
  "#fdcb6e",
  "#54a0ff",
  "#ff6348",
];

interface Splash {
  key: string;
  x: number;
  y: number;
  size: number;
  color: string;
  delay: number;
  duration: number;
  tl: number;
  tr: number;
  br: number;
  bl: number;
  gx: number;
  gy: number;
  satellites: Array<{ ang: number; dist: number; sz: number }>;
}

function generateSplashes(count: number, seed: number): Splash[] {
  return Array.from({ length: count }, (_, i) => {
    const r1 = (Math.sin(i * 12.9898 + seed) * 43758.5453) % 1;
    const r2 = (Math.sin(i * 78.233 + seed * 1.7) * 43758.5453) % 1;
    const r3 = (Math.sin(i * 39.346 + seed * 2.9) * 43758.5453) % 1;
    const r4 = (Math.sin(i * 56.789 + seed * 3.1) * 43758.5453) % 1;
    const r5 = (Math.sin(i * 91.234 + seed * 4.3) * 43758.5453) % 1;
    const r6 = (Math.sin(i * 23.456 + seed * 5.7) * 43758.5453) % 1;

    const abs = (v: number) => Math.abs(v);
    return {
      key: `${seed}-${i}`,
      x: abs(r1) * 96 + 2,
      y: abs(r2) * 92 + 4,
      size: 28 + abs(r3) * 56,
      color: COLORS[Math.floor(abs(r4) * COLORS.length)] ?? "#ff4757",
      delay: abs(r5) * 1.5,
      duration: 2.8 + abs(r6) * 1.8,
      // 거의 원형 ± 약간만 변형 (코너 차이 너무 크면 일그러짐)
      tl: 42 + abs(r1) * 18,
      tr: 42 + abs(r2) * 18,
      br: 42 + abs(r3) * 18,
      bl: 42 + abs(r4) * 18,
      gx: 30 + abs(r5) * 25,
      gy: 30 + abs(r6) * 25,
      satellites: [
        { ang: i * 1.7 + seed * 0.3, dist: 0.78, sz: 0.16 },
        { ang: i * 2.9 + seed * 0.5 + 1.2, dist: 0.92, sz: 0.11 },
        { ang: i * 3.7 + seed * 0.7 + 2.5, dist: 1.15, sz: 0.09 },
        { ang: i * 4.3 + seed * 0.9 + 4.1, dist: 1.0, sz: 0.07 },
      ],
    };
  });
}

const CYCLE_MS = 3800;
const SPLASH_COUNT = 14;

export function PaintAnimation({ className }: { className?: string }) {
  const [seed, setSeed] = useState(1);
  const splashes = generateSplashes(SPLASH_COUNT, seed);

  useEffect(() => {
    const id = setInterval(() => {
      setSeed((s) => s + 1);
    }, CYCLE_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-0", className)}
    >
      {splashes.map((s) => {
        const r = s.size * 0.7;
        const boxShadow = s.satellites
          .map((sat) => {
            const px = (Math.cos(sat.ang) * r * sat.dist).toFixed(1);
            const py = (Math.sin(sat.ang) * r * sat.dist).toFixed(1);
            const sz = Math.min(s.size * sat.sz, 6);
            const spread = (s.size / 2 - sz).toFixed(1);
            return `${px}px ${py}px 0 -${spread}px ${s.color}`;
          })
          .join(", ");

        return (
          <span
            key={s.key}
            className="animate-paint-splash absolute block origin-bottom"
            style={{
              left: `${s.x}%`,
              top: `${s.y}%`,
              width: s.size,
              height: s.size,
              borderRadius: `${s.tl}% ${s.tr}% ${s.br}% ${s.bl}%`,
              background: `radial-gradient(circle at ${s.gx}% ${s.gy}%, ${s.color} 0%, ${s.color} 50%, ${s.color}cc 75%, transparent 100%)`,
              filter: "blur(0.6px)",
              boxShadow,
              mixBlendMode: "multiply",
              animationDelay: `${s.delay}s`,
              animationDuration: `${s.duration}s`,
              opacity: 0,
            }}
          />
        );
      })}
    </div>
  );
}
