import { Style, Avatar as DicebearAvatar } from "@dicebear/core";
import type { StyleDefinition } from "@dicebear/core";
import glassDefinition from "@dicebear/styles/glass.json" with { type: "json" };

const glassStyle = new Style(glassDefinition as StyleDefinition);

// idRandomization으로 같은 seed라도 호출마다 다른 data URI가 생성되어
// 리렌더/리마운트 시 아바타가 깜빡인다. seed별로 한 번만 생성해 캐싱한다.
const dataUriCache = new Map<string, string>();

/** 시드 기반 Glass 스타일 DiceBear 아바타 data URI (seed별 캐싱) */
export function createDicebearAvatarDataUri(seed: string): string {
  const cached = dataUriCache.get(seed);
  if (cached) return cached;

  const avatar = new DicebearAvatar(glassStyle, {
    backgroundColorFill: ["linear"],
    shapeVariant: [],
    backgroundColorAngle: -147,
    backgroundColorFillStops: 2,
    idRandomization: true,
    seed,
  });

  const uri = avatar.toDataUri();
  dataUriCache.set(seed, uri);
  return uri;
}
