"use client";

import { motion } from "framer-motion";
import type { MotionComponentProps } from "../presets/motionPresets";

/** 위아래로 훑고 지나가는 레트로 스캔라인 + 은은한 펄스. */
export function RetroPulse({ palette, params, reducedMotion }: MotionComponentProps) {
  const speed = params?.speed ?? 1;
  const accent = palette.swatches[0] ?? palette.accent;

  if (reducedMotion) {
    return (
      <span
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(transparent 0%, ${accent}22 50%, transparent 100%)`,
          opacity: 0.4,
        }}
      />
    );
  }

  return (
    <>
      <motion.span
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          height: "22%",
          background: `linear-gradient(transparent, ${accent}33, transparent)`,
        }}
        initial={{ top: "-22%" }}
        animate={{ top: ["-22%", "100%"] }}
        transition={{ duration: 4 / speed, repeat: Infinity, ease: "linear" }}
      />
      <motion.span
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(circle at 50% 60%, ${accent}22 0%, transparent 60%)`,
        }}
        animate={{ opacity: [0.25, 0.5, 0.25] }}
        transition={{ duration: 3 / speed, repeat: Infinity, ease: "easeInOut" }}
      />
    </>
  );
}
