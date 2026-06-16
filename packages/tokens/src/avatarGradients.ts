/**
 * 아바타 그라데이션 팔레트 — Partiful식 비비드 모노그램 아바타.
 * 사용자 이름/ID를 해시해 결정적으로 하나를 고른다(@wara/ui Avatar).
 * 라이트/다크 공통(채도 높은 컬러라 양 테마에서 동작).
 */
export interface AvatarGradient {
  from: string;
  to: string;
  /** 모노그램 텍스트 색 (대비 확보) */
  fg: string;
}

export const avatarGradients: AvatarGradient[] = [
  { from: "#FF8A4C", to: "#FF3D77", fg: "#FFFFFF" }, // orange→pink (AS)
  { from: "#8B5CF6", to: "#5B9DFF", fg: "#FFFFFF" }, // purple→blue (JD)
  { from: "#5B9DFF", to: "#FF6FA3", fg: "#FFFFFF" }, // blue→pink (SL)
  { from: "#34D399", to: "#3BC4F2", fg: "#0B2B26" }, // green→cyan
  { from: "#FBBF24", to: "#FF7A45", fg: "#3A2400" }, // amber→orange
  { from: "#22D3EE", to: "#6D5BFF", fg: "#FFFFFF" }, // cyan→indigo
  { from: "#F472B6", to: "#A78BFA", fg: "#FFFFFF" }, // pink→lavender
  { from: "#7DE2B8", to: "#5B9DFF", fg: "#06251C" }, // mint→blue
  { from: "#FF6FA3", to: "#FFB14D", fg: "#3A1020" }, // pink→amber
  { from: "#A78BFA", to: "#22D3EE", fg: "#160A2E" }, // lavender→cyan
];

/** 문자열을 안정적으로 팔레트 인덱스로 매핑 */
export function avatarGradientIndex(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) | 0;
  }
  return Math.abs(h) % avatarGradients.length;
}

export function pickAvatarGradient(seed: string): AvatarGradient {
  return avatarGradients[avatarGradientIndex(seed)]!;
}
