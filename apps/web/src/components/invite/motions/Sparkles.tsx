"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import type { MotionComponentProps } from "../presets/motionPresets";

/** 제자리에서 반짝였다 사라지는 반짝임. */
export function Sparkles({ palette, params, reducedMotion }: MotionComponentProps) {
  const count = Math.min(params?.count ?? 20, 30);
  const speed = params?.speed ?? 1;
  const items = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: (i * 43) % 100,
        top: (i * 67) % 100,
        size: 4 + ((i * 11) % 7),
        delay: (i % 9) * 0.4,
        duration: (1.6 + ((i * 3) % 3) * 0.4) / speed,
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
              top: `${s.top}%`,
              width: s.size,
              height: s.size,
              borderRadius: 9999,
              background: s.color,
              opacity: 0.6,
            }}
          />
        ) : (
          <motion.span
            key={s.id}
            style={{
              position: "absolute",
              left: `${s.left}%`,
              top: `${s.top}%`,
              width: s.size,
              height: s.size,
              borderRadius: 9999,
              background: s.color,
              boxShadow: `0 0 6px ${s.color}`,
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1, 0], opacity: [0, 1, 0] }}
            transition={{ duration: s.duration, delay: s.delay, repeat: Infinity, repeatDelay: 1.2, ease: "easeInOut" }}
          />
        ),
      )}
    </>
  );
}
