"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import type { MotionComponentProps } from "../presets/motionPresets";

/** 위에서 떨어지며 회전하는 색종이 조각. */
export function Confetti({ palette, params, reducedMotion }: MotionComponentProps) {
  const count = Math.min(params?.count ?? 24, 30);
  const speed = params?.speed ?? 1;
  const items = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: (i * 53) % 100,
        w: 6 + ((i * 7) % 6),
        h: 9 + ((i * 5) % 7),
        delay: (i % 8) * 0.5,
        duration: (6 + ((i * 9) % 5)) / speed,
        drift: ((i % 5) - 2) * 30,
        color: palette.swatches[i % palette.swatches.length] ?? palette.accent,
      })),
    [count, speed, palette],
  );

  return (
    <>
      {items.map((s) =>
        reducedMotion ? (
          <span
            key={s.id}
            style={{
              position: "absolute",
              left: `${s.left}%`,
              top: `${(s.id * 23) % 88}%`,
              width: s.w,
              height: s.h,
              borderRadius: 2,
              background: s.color,
              opacity: 0.55,
            }}
          />
        ) : (
          <motion.span
            key={s.id}
            style={{
              position: "absolute",
              left: `${s.left}%`,
              top: -14,
              width: s.w,
              height: s.h,
              borderRadius: 2,
              background: s.color,
            }}
            initial={{ y: 0, x: 0, rotate: 0, opacity: 0 }}
            animate={{
              y: ["0%", "1100%"],
              x: [0, s.drift, -s.drift, 0],
              rotate: [0, 220, 540],
              opacity: [0, 1, 0],
            }}
            transition={{ duration: s.duration, delay: s.delay, repeat: Infinity, ease: "easeIn" }}
          />
        ),
      )}
    </>
  );
}
