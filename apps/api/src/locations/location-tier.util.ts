export type LocationTier = 'full' | 'distance' | 'hidden';

// distance 티어에서 좌표를 스냅할 격자 크기(도). 약 1.1km.
const COARSE_GRID_DEG = 0.01;
// distance 티어에서 최소로 표기할 정확도 반경(m).
const COARSE_ACCURACY_M = 1000;

/** 유저 기본 티어 + 참가자 오버라이드로 유효 티어 계산. */
export function effectiveTier(participantTier: LocationTier | null | undefined, userDefault: LocationTier): LocationTier {
  return participantTier ?? userDefault;
}

function snap(v: number): number {
  return Math.round(v / COARSE_GRID_DEG) * COARSE_GRID_DEG;
}

/**
 * 위치를 티어에 맞게 마스킹.
 * - full: 그대로
 * - distance: 좌표를 격자로 스냅(대략 위치) + 정확도 반경 확대
 * - hidden: null (노출 안 함)
 */
export function maskLocation<T extends { lat: number; lng: number; accuracy: number }>(
  loc: T,
  tier: LocationTier,
): (T & { tier: LocationTier }) | null {
  if (tier === 'hidden') return null;
  if (tier === 'full') return { ...loc, tier };
  return {
    ...loc,
    lat: snap(loc.lat),
    lng: snap(loc.lng),
    accuracy: Math.max(loc.accuracy, COARSE_ACCURACY_M),
    tier,
  };
}
