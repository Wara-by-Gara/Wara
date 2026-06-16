"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import type { MotionComponentProps } from "../presets/motionPresets";

/** 가로로 천천히 흐르는 구름. */
export function CloudDrift({ palette, params, reducedMotion }: MotionComponentProps) {
  const count = Math.min(params?.count ?? 6, 10);
  const speed = params?.speed ?? 1;
  const items = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        top: (i * 37) % 80,
        w: 90 + ((i * 41) % 90),
        h: 34 + ((i * 17) % 26),
        delay: (i % 5) * 1.5,
        duration: (18 + ((i * 11) % 12)) / speed,
        color: palette.swatches[i % palette.swatches.length] ?? "#FFFFFF",
      })),
    [count, speed, palette],
  );

  return (
    <>
      {items.map((s) => {
        const cloud = {
          width: s.w,
          height: s.h,
          borderRadius: 9999,
          background: s.color,
          filter: "blur(6px)",
          opacity: 0.7,
        };
        return reducedMotion ? (
          <span key={s.id} style={{ position: "absolute", left: `${(s.id * 23) % 70}%`, top: `${s.top}%`, ...cloud }} />
        ) : (
          <motion.span
            key={s.id}
            style={{ position: "absolute", top: `${s.top}%`, ...cloud }}
            initial={{ x: "-30%" }}
            animate={{ x: ["-30%", "130%"] }}
            transition={{ duration: s.duration, delay: s.delay, repeat: Infinity, ease: "linear" }}
          />
        );
      })}
    </>
  );
}
