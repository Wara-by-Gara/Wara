"use client";

import { useReducedMotion } from "framer-motion";
import { motionPresets } from "../presets/motionPresets";
import type { InvitePalette, MotionSpec } from "../types";

export function MotionLayer({
  spec,
  palette,
  /** 미리보기 등에서 모션 강제 정지 */
  paused = false,
}: {
  spec?: MotionSpec | null;
  palette: InvitePalette;
  paused?: boolean;
}) {
  const prefersReduced = useReducedMotion();
  if (!spec) return null;
  const Motion = motionPresets[spec.preset];
  if (!Motion) return null;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <Motion
        palette={palette}
        params={spec.params}
        reducedMotion={paused || Boolean(prefersReduced)}
      />
    </div>
  );
}
