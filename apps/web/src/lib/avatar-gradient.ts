import type { CSSProperties } from "react";

/** 이니셜/키마다 다른 파스텔 그라데이션 (SSR·리렌더마다 안정적인 해시 선택) */
const PAIRS = [
  ["#7ccbff", "#ffb8ca"],
  ["#a78bfa", "#fecdd3"],
  ["#5eead4", "#fcd34d"],
  ["#93c5fd", "#fca5a5"],
  ["#bbf7d0", "#fca5dc"],
  ["#fde68a", "#a5b4fc"],
  ["#67e8f9", "#4e1219ff"],
  ["#c4b5fd", "#fcd9b8"],
  ["#86efac", "#fdba74"],
  ["#7dd3fc", "#fbcfe8"],
  ["#d8b4fe", "#fde047"],
  ["#38bdf8", "#fcd34d"],
  // === extended palette ===
  ["#fda4af", "#bae6fd"], // rose → light sky
  ["#fbcfe8", "#a7f3d0"], // pink → mint
  ["#fde68a", "#fda4af"], // cream → rose
  ["#c4b5fd", "#5eead4"], // lavender → teal
  ["#fed7aa", "#a78bfa"], // peach → purple
  ["#bef264", "#67e8f9"], // lime → cyan
  ["#fef08a", "#f9a8d4"], // soft yellow → pink
  ["#bbf7d0", "#93c5fd"], // green → blue
  ["#fbcfe8", "#c7d2fe"], // pink → indigo
  ["#fdba74", "#fbcfe8"], // orange → pink
  ["#7dd3fc", "#d8b4fe"], // sky → purple
  ["#86efac", "#bae6fd"], // green → sky
] as const;

function gradientAtIndex(i: number): string {
  const idx = ((i % PAIRS.length) + PAIRS.length) % PAIRS.length;
  const [a, b] = PAIRS[idx]!;
  return `linear-gradient(135deg, ${a}, ${b})`;
}

function hashSeed(key: string): number {
  let h = 0;
  for (let i = 0; i < key.length; i += 1) {
    h = Math.imul(31, h) + key.charCodeAt(i);
  }
  return Math.abs(h);
}

export function avatarGradientBackgroundImage(key: string): string {
  return gradientAtIndex(hashSeed(key));
}

export function avatarGradientStyle(key: string): Pick<CSSProperties, "backgroundImage"> {
  return { backgroundImage: avatarGradientBackgroundImage(key) };
}
