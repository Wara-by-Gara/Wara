/** 캔버스 파티클 깜빡임(twinkle) 공용 로직 — phase를 진행시키고 sin 기반 alpha(0~1)를 반환 */
export function advanceTwinkle(entity: { phase: number; speed: number }, dt: number): number {
  entity.phase += entity.speed * dt;
  return Math.max(0, Math.sin(entity.phase));
}
