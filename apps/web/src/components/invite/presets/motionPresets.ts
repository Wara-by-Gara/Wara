import type { ComponentType } from "react";
import type { InvitePalette } from "../types";
import { FloatingStars } from "../motions/FloatingStars";
import { FallingPetals } from "../motions/FallingPetals";
import { Confetti } from "../motions/Confetti";
import { Sparkles } from "../motions/Sparkles";
import { SoftGlow } from "../motions/SoftGlow";
import { Balloons } from "../motions/Balloons";
import { CloudDrift } from "../motions/CloudDrift";
import { PaperPlanes } from "../motions/PaperPlanes";
import { RetroPulse } from "../motions/RetroPulse";

export interface MotionParams {
  /** 파티클 수 (모바일 성능 위해 최대 30 제한) */
  count?: number;
  /** 속도 배수 (1 = 기본) */
  speed?: number;
}

export interface MotionComponentProps {
  palette: InvitePalette;
  params?: MotionParams;
  /** prefers-reduced-motion 시 정적 렌더 */
  reducedMotion: boolean;
}

/**
 * 모션 프리셋 — framer-motion 파티클 컴포넌트 맵.
 * transform·opacity 중심, 파티클 수 제한, reduced-motion 대응.
 * 새 모션은 motions/에 컴포넌트 추가 후 여기에 등록.
 */
export const motionPresets = {
  floatingStars: FloatingStars,
  fallingPetals: FallingPetals,
  confetti: Confetti,
  sparkles: Sparkles,
  softGlow: SoftGlow,
  balloons: Balloons,
  cloudDrift: CloudDrift,
  paperPlanes: PaperPlanes,
  retroPulse: RetroPulse,
} as const satisfies Record<string, ComponentType<MotionComponentProps>>;

export type MotionPresetKey = keyof typeof motionPresets;
