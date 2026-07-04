import type { GradientVariant } from "../constants";
import { OceanScene } from "./OceanScene";
import { LightningScene } from "./LightningScene";
import { SoccerScene } from "./SoccerScene";
import { SunsetScene } from "./SunsetScene";

/** 애니메이션 그라데이션 배경 — 콘텐츠 뒤 바닥 레이어. */
export function GradientScene({
  variant,
  className,
}: {
  variant: GradientVariant;
  className?: string;
}) {
  if (variant.id === "sunset")   return <SunsetScene   className={className} />;
  if (variant.id === "ocean")    return <OceanScene    className={className} />;
  if (variant.id === "lightning") return <LightningScene className={className} />;
  if (variant.id === "soccer")   return <SoccerScene   className={className} />;
}
