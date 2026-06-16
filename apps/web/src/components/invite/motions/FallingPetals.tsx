"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import type { MotionComponentProps } from "../presets/motionPresets";

/** 위에서 흩날리며 떨어지는 꽃잎/조각. transform·opacity만 사용. */
export function FallingPetals({ palette, params, reducedMotion }: MotionComponentProps) {
  const count = Math.min(params?.count ?? 16, 30);
  const speed = params?.speed ?? 1;

  const items = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: (i * 41) % 100,
        size: 7 + ((i * 11) % 7),
        delay: (i % 7) * 0.7,
        duration: (7 + ((i * 5) % 6)) / speed,
        drift: ((i % 5) - 2) * 24,
        color: palette.swatches[i % palette.swatches.length] ?? palette.accent,
      })),
    [count, speed, palette],
  );

  if (reducedMotion) {
    return (
      <>
        {items.map((s) => (
          <span
            key={s.id}
            style={{
              position: "absolute",
              left: `${s.left}%`,
              top: `${(s.id * 31) % 88}%`,
              width: s.size,
              height: s.size,
              borderRadius: "50% 0 50% 0",
              background: s.color,
              opacity: 0.5,
            }}
          />
        ))}
      </>
    );
  }

  return (
    <>
      {items.map((s) => (
        <motion.span
          key={s.id}
          style={{
            position: "absolute",
            left: `${s.left}%`,
            top: -12,
            width: s.size,
            height: s.size,
            borderRadius: "50% 0 50% 0",
            background: s.color,
          }}
          initial={{ y: 0, x: 0, rotate: 0, opacity: 0 }}
          animate={{
            y: ["0%", "1000%"],
            x: [0, s.drift, 0],
            rotate: [0, 180, 360],
            opacity: [0, 0.85, 0],
          }}
          transition={{
            duration: s.duration,
            delay: s.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </>
  );
}
