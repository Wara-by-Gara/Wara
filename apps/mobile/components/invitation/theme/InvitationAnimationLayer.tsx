/**
 * 초대장 애니메이션 효과 레이어 — 웹 InvitationAnimation.tsx 미러.
 * CONFIG 파라미터(개수/크기/속도/색)를 미러하되 개수는 모바일 성능에 맞춰 축소.
 *
 * 웹 커스텀 효과 대응:
 * - cloud/balloon: 웹은 PNG/Lottie — emoji 파티클 근사
 * - paper: 웹 PaperConfettiAnimation — confetti 낙하 근사
 * - crystal/bokeh: 웹 글리터/빛망울 — star twinkle 근사
 * - flower: 웹 꽃 PNG 낙하 — 웜톤 petal 낙하 근사
 * - firework/stream/blackcat/paint: 재현 불가(폭죽 물리/Three.js/Lottie) → 생략(null)
 */

import { ParticleField } from './ParticleField';
import type { ParticleEffectConfig } from './ParticleField';

const CONFIGS: Record<string, ParticleEffectConfig> = {
  cherry: {
    anim: 'fall', visual: 'petal', count: 16, size: [10, 22], duration: [8, 15],
    drift: [-60, 60], opacity: [0.5, 0.82],
    colors: ['#ffe1ef', '#ff9aca', '#ffd6e0', '#ffb3d9'],
  },
  leaf: {
    anim: 'fall', visual: 'emoji', count: 12, size: [16, 26], duration: [7, 18],
    drift: [-80, 80], opacity: [0.75, 1], emojis: ['🍂', '🍁'],
  },
  confetti: {
    anim: 'confetti', visual: 'confetti', count: 24, size: [6, 12], duration: [4, 8],
    drift: [-90, 90], opacity: [0.85, 1],
    colors: ['#ff6db3', '#ffd43b', '#5bc1ff', '#34d399', '#c084fc', '#fb923c'],
  },
  cloud: {
    anim: 'drift', visual: 'emoji', count: 6, size: [42, 82], duration: [22, 42],
    drift: [-40, 40], opacity: [0.7, 0.95], emojis: ['☁️'], spin: false,
  },
  baseball: {
    anim: 'confetti', visual: 'emoji', count: 5, size: [22, 34], duration: [4, 9],
    drift: [-120, 120], opacity: [0.95, 1], emojis: ['⚾️'],
  },
  heart: {
    anim: 'rise', visual: 'emoji', count: 12, size: [14, 28], duration: [7, 12],
    drift: [-45, 45], opacity: [0.7, 1], emojis: ['💕', '💗', '🩷', '💖'], spin: false,
  },
  balloon: {
    anim: 'rise', visual: 'emoji', count: 8, size: [26, 46], duration: [12, 20],
    drift: [-30, 30], opacity: [0.85, 1], emojis: ['🎈'], spin: false,
  },
  plane: {
    anim: 'rise', visual: 'emoji', count: 5, size: [20, 30], duration: [5, 15],
    drift: [-80, 80], opacity: [0.95, 1], tilt: [-20, 20], emojis: ['✈️', '🛩️'], spin: false,
  },
  bubble: {
    anim: 'rise', visual: 'bubble', count: 14, size: [10, 28], duration: [8, 16],
    drift: [-50, 50], opacity: [0.28, 0.55], spin: false,
  },
  star: {
    anim: 'twinkle', visual: 'star', count: 18, size: [8, 20], duration: [2, 5],
    drift: [0, 0], opacity: [0.6, 1],
  },
  // ── 웹 커스텀 효과 근사 ──
  paper: {
    anim: 'fall', visual: 'confetti', count: 26, size: [7, 14], duration: [5, 10],
    drift: [-70, 70], opacity: [0.85, 1],
    colors: ['#ff6db3', '#ffd43b', '#5bc1ff', '#34d399', '#c084fc', '#fb923c'],
  },
  crystal: {
    anim: 'twinkle', visual: 'star', count: 22, size: [4, 10], duration: [1.5, 4],
    drift: [0, 0], opacity: [0.7, 1],
  },
  bokeh: {
    anim: 'twinkle', visual: 'star', count: 14, size: [18, 44], duration: [3, 7],
    drift: [0, 0], opacity: [0.25, 0.5],
  },
  flower: {
    anim: 'fall', visual: 'petal', count: 14, size: [12, 24], duration: [8, 16],
    drift: [-70, 70], opacity: [0.7, 0.95],
    colors: ['#ffb3c8', '#ffd9a8', '#ffe9f0', '#f8b4d9'],
  },
};

export function InvitationAnimationLayer({ animation }: { animation?: string }) {
  if (!animation || animation === 'none') return null;
  const config = CONFIGS[animation];
  if (!config) return null;
  return <ParticleField config={config} />;
}
