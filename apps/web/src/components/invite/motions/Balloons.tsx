"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import type { MotionComponentProps } from "../presets/motionPresets";

/** 아래에서 천천히 떠오르는 풍선. */
export function Balloons({ palette, params, reducedMotion }: MotionComponentProps) {
  const count = Math.min(params?.count ?? 10, 16);
  const speed = params?.speed ?? 1;
  const items = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: (i * 59) % 92,
        size: 26 + ((i * 13) % 18),
        delay: (i % 6) * 1.1,
        duration: (10 + ((i * 7) % 6)) / speed,
        sway: ((i % 3) - 1) * 18,
        color: palette.swatches[i % palette.swatches.length] ?? palette.accent,
      })),
    [count, speed, palette],
  );

  return (
    <>
      {items.map((s) => {
        const balloon = (
          <span style={{ position: "relative", display: "block", width: s.size, height: s.size * 1.2 }}>
            <span
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "50% 50% 50% 50% / 55% 55% 45% 45%",
                background: s.color,
                opacity: 0.85,
              }}
            />
            <span
              style={{
                position: "absolute",
                bottom: -s.size * 0.5,
                left: "50%",
                width: 1,
                height: s.size * 0.5,
                background: "rgba(255,255,255,0.4)",
              }}
            />
          </span>
        );
        return reducedMotion ? (
          <span key={s.id} style={{ position: "absolute", left: `${s.left}%`, top: `${(s.id * 31) % 70}%`, opacity: 0.7 }}>
            {balloon}
          </span>
        ) : (
          <motion.span
            key={s.id}
            style={{ position: "absolute", left: `${s.left}%`, bottom: -60 }}
            initial={{ y: 0, x: 0, opacity: 0 }}
            animate={{ y: ["0%", "-1200%"], x: [0, s.sway, 0], opacity: [0, 0.9, 0] }}
            transition={{ duration: s.duration, delay: s.delay, repeat: Infinity, ease: "easeInOut" }}
          >
            {balloon}
          </motion.span>
        );
      })}
    </>
  );
}
