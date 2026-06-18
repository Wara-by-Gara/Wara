"use client";

import { useEffect, useMemo, useState } from "react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { cn } from "@/lib/cn";

/**
 * 페인트 splash 애니메이션 (Lottie 기반):
 * - LottieFiles에서 다운받은 "Lottie Simple License" 또는 "Free" 라이센스의
 *   페인트 splash JSON 파일들을 무작위 위치/크기/박자로 깔아 띄움.
 * - 사이클 끝나면 새 위치·새 파일로 재생성 (진짜 무작위).
 * - mix-blend-mode: multiply로 페인트끼리 겹치면 잉크처럼 색이 섞임.
 *
 * 파일 경로 SoT: apps/web/public/lottie/paint/
 * 라이센스 노트: LottieFiles "Lottie Simple License" / "Free" / "CC0"만 사용.
 *   CC BY는 푸터에 작가 attribution 필요.
 */

// public/lottie/paint/ 안에 받은 JSON 파일 풀 — 무작위로 선택되어 splash 인스턴스에 적용
const LOTTIE_FILES = [
  "/lottie/paint/splash-1.json",
  "/lottie/paint/splash-2.json",
  "/lottie/paint/splash-3.json",
  "/lottie/paint/splash-4.json",
  "/lottie/paint/splash-5.json",
  "/lottie/paint/splash-6.json",
];

interface Splash {
  key: string;
  src: string;
  x: number; // %
  y: number; // %
  size: number; // px
  delay: number; // s
  rotation: number; // deg
}

function abs(v: number) {
  return Math.abs(v);
}

function generateSplashes(count: number, seed: number): Splash[] {
  return Array.from({ length: count }, (_, i) => {
    const r1 = (Math.sin(i * 12.9898 + seed) * 43758.5453) % 1;
    const r2 = (Math.sin(i * 78.233 + seed * 1.7) * 43758.5453) % 1;
    const r3 = (Math.sin(i * 39.346 + seed * 2.9) * 43758.5453) % 1;
    const r4 = (Math.sin(i * 56.789 + seed * 3.1) * 43758.5453) % 1;
    const r5 = (Math.sin(i * 91.234 + seed * 4.3) * 43758.5453) % 1;
    const r6 = (Math.sin(i * 23.456 + seed * 5.7) * 43758.5453) % 1;

    return {
      key: `${seed}-${i}`,
      src: LOTTIE_FILES[Math.floor(abs(r1) * LOTTIE_FILES.length)] ?? LOTTIE_FILES[0]!,
      x: abs(r2) * 90 + 5,
      y: abs(r3) * 85 + 5,
      size: 120 + abs(r4) * 200, // 120~320px
      delay: abs(r5) * 1.2,
      rotation: (abs(r6) - 0.5) * 60, // -30~30deg
    };
  });
}

const CYCLE_MS = 4200;
const SPLASH_COUNT = 8;

export function PaintAnimation({ className }: { className?: string }) {
  const [seed, setSeed] = useState(1);
  const splashes = useMemo(() => generateSplashes(SPLASH_COUNT, seed), [seed]);

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
      {splashes.map((s) => (
        <div
          key={s.key}
          className="absolute"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.size,
            height: s.size,
            transform: `translate(-50%, -50%) rotate(${s.rotation}deg)`,
            mixBlendMode: "multiply",
            animation: `paint-lottie-fade 3.5s ease-in-out ${s.delay}s 1 forwards`,
            opacity: 0,
          }}
        >
          <DotLottieReact
            src={s.src}
            autoplay
            loop={false}
            style={{ width: "100%", height: "100%" }}
          />
        </div>
      ))}
    </div>
  );
}
