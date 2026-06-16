"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import type { MotionComponentProps } from "../presets/motionPresets";

/** 크게 번지는 빛 덩어리가 천천히 호흡하듯 커졌다 작아짐. */
export function SoftGlow({ palette, params, reducedMotion }: MotionComponentProps) {
  const count = Math.min(params?.count ?? 4, 6);
  const speed = params?.speed ?? 1;
  const items = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: (i * 61) % 90,
        top: (i * 47) % 80,
        size: 140 + ((i * 53) % 120),
        delay: i * 0.8,
        duration: (7 + (i % 3) * 2) / speed,
        color: palette.swatches[i % palette.swatches.length] ?? palette.accent,
      })),
    [count, speed, palette],
  );

  return (
    <>
      {items.map((s) => {
        const common = {
          position: "absolute" as const,
          left: `${s.left}%`,
          top: `${s.top}%`,
          width: s.size,
          height: s.size,
          borderRadius: 9999,
          background: `radial-gradient(circle, ${s.color} 0%, transparent 70%)`,
          filter: "blur(8px)",
        };
        return reducedMotion ? (
          <span key={s.id} style={{ ...common, opacity: 0.35 }} />
        ) : (
          <motion.span
            key={s.id}
            style={common}
            initial={{ scale: 0.85, opacity: 0.2 }}
            animate={{ scale: [0.85, 1.15, 0.85], opacity: [0.2, 0.5, 0.2] }}
            transition={{ duration: s.duration, delay: s.delay, repeat: Infinity, ease: "easeInOut" }}
          />
        );
      })}
    </>
  );
}
