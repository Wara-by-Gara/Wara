import { Style, Avatar as DicebearAvatar } from "@dicebear/core";
import type { StyleDefinition } from "@dicebear/core";
import glassDefinition from "@dicebear/styles/glass.json" with { type: "json" };

const glassStyle = new Style(glassDefinition as StyleDefinition);

/** 시드 기반 Glass 스타일 DiceBear 아바타 data URI */
export function createDicebearAvatarDataUri(seed: string): string {
  const avatar = new DicebearAvatar(glassStyle, {
    backgroundColorFill: ["linear"],
    shapeVariant: [],
    backgroundColorAngle: -147,
    backgroundColorFillStops: 2,
    idRandomization: true,
    seed,
  });

  return avatar.toDataUri();
}
