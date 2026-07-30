import type { GradientColors } from "../constants";
import { OceanScene } from "./OceanScene";
import { LightningScene } from "./LightningScene";
import { SoccerScene } from "./SoccerScene";
import { SunsetScene } from "./SunsetScene";

/** 애니메이션 그라데이션 배경 — 콘텐츠 뒤 바닥 레이어.
 * named preset(sunset/ocean/lightning/soccer) 외 id는 애니메이션 없이 아무것도 그리지 않는다
 * — 이 경우 정적 `.bg-invite-grad-base`(c1/c2) fallback이 배경을 담당한다. */
export function GradientScene({
  variant,
  className,
}: {
  variant: GradientColors;
  className?: string;
}) {
  if (variant.id === "sunset")   return <SunsetScene   className={className} />;
  if (variant.id === "ocean")    return <OceanScene    className={className} />;
  if (variant.id === "lightning") return <LightningScene className={className} />;
  if (variant.id === "soccer")   return <SoccerScene   className={className} />;
}
