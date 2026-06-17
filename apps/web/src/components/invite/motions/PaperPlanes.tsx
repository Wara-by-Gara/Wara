"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import type { MotionComponentProps } from "../presets/motionPresets";

/** 대각선으로 날아가는 종이비행기(삼각형). */
export function PaperPlanes({ palette, params, reducedMotion }: MotionComponentProps) {
  const count = Math.min(params?.count ?? 8, 14);
  const speed = params?.speed ?? 1;
  const items = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        top: (i * 53) % 85,
        size: 10 + ((i * 7) % 8),
        delay: (i % 6) * 1.2,
        duration: (9 + ((i * 5) % 6)) / speed,
        rise: -((i % 4) * 20 + 20),
        color: palette.swatches[i % palette.swatches.length] ?? palette.accent,
      })),
    [count, speed, palette],
  );

  return (
    <>
      {items.map((s) => {
        const plane = {
          width: 0,
          height: 0,
          borderTop: `${s.size}px solid transparent`,
          borderBottom: `${s.size}px solid transparent`,
          borderLeft: `${s.size * 1.6}px solid ${s.color}`,
          opacity: 0.85,
        };
        return reducedMotion ? (
          <span key={s.id} style={{ position: "absolute", left: `${(s.id * 29) % 80}%`, top: `${s.top}%`, ...plane }} />
        ) : (
          <motion.span
            key={s.id}
            style={{ position: "absolute", top: `${s.top}%`, ...plane }}
            initial={{ x: "-20%", y: 0, opacity: 0 }}
            animate={{ x: ["-20%", "130%"], y: [0, s.rise], opacity: [0, 0.9, 0] }}
            transition={{ duration: s.duration, delay: s.delay, repeat: Infinity, ease: "easeInOut" }}
          />
        );
      })}
    </>
  );
}
