/**
 * 벚꽃 낙하 이스터에그 — 웹 InvitationCherryBlossomEffect 미러.
 * 제목에 '곰돌이들 모임' 이 포함되면 벚꽃잎이 떨어진다.
 */

import { ParticleField } from './ParticleField';
import type { ParticleEffectConfig } from './ParticleField';

const TRIGGER = '곰돌이들 모임';

// 웹 CherryBlossomRain: 26개 / 12~26px / 8~15s / drift ±48 / COLORS 미러 (개수는 성능상 18개로 축소)
const CHERRY_BLOSSOM_CONFIG: ParticleEffectConfig = {
  anim: 'fall',
  visual: 'petal',
  count: 18,
  size: [12, 26],
  duration: [8, 15],
  drift: [-48, 48],
  opacity: [0.52, 0.68],
  colors: ['#ffffff', '#ffe1ef', '#ff9aca', '#ffd6e0'],
};

export function hasCherryBlossomEffect(title: string): boolean {
  return title.includes(TRIGGER);
}

export function CherryBlossomEffect({ title }: { title: string }) {
  if (!hasCherryBlossomEffect(title)) return null;
  return <ParticleField config={CHERRY_BLOSSOM_CONFIG} />;
}
