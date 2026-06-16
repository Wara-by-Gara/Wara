"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import type { MotionComponentProps } from "../presets/motionPresets";

/** 위로 천천히 떠오르며 반짝이는 별/입자. transform·opacity만 사용. */
export function FloatingStars({ palette, params, reducedMotion }: MotionComponentProps) {
  const count = Math.min(params?.count ?? 18, 30);
  const speed = params?.speed ?? 1;

  const items = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: (i * 37) % 100,
        size: 4 + ((i * 13) % 8),
        delay: (i % 6) * 0.6,
        duration: (6 + ((i * 7) % 6)) / speed,
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
              top: `${(s.id * 29) % 90}%`,
              width: s.size,
              height: s.size,
              borderRadius: 9999,
              background: s.color,
              opacity: 0.5,
            }}
          />
        ) : (
          <motion.span
            key={s.id}
            style={{
              position: "absolute",
              left: `${s.left}%`,
              bottom: -10,
              width: s.size,
              height: s.size,
              borderRadius: 9999,
              background: s.color,
            }}
            initial={{ y: 0, opacity: 0 }}
            animate={{ y: ["0%", "-900%"], opacity: [0, 0.9, 0] }}
            transition={{
              duration: s.duration,
              delay: s.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ),
      )}
    </>
  );
}
