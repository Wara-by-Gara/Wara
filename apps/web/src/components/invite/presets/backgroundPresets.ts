import type { CSSProperties } from "react";
import type { InvitePalette } from "../types";

export interface BackgroundParams {
  /** 선형 그라데이션 각도 (deg) */
  angle?: number;
}

const at = (x: number, y: number, color: string, stop = 55) =>
  `radial-gradient(at ${x}% ${y}%, ${color} 0%, transparent ${stop}%)`;

const sw = (p: InvitePalette, i: number, fallback?: string) =>
  p.swatches[i] ?? fallback ?? p.accent;

/**
 * 배경 프리셋 — 팔레트(+params)로 CSS 배경 스타일을 생성한다.
 * 새 배경 스타일은 여기에 키를 추가하면 모든 템플릿에서 사용 가능.
 */
type BackgroundBuilder = (
  p: InvitePalette,
  params?: BackgroundParams,
) => CSSProperties;

export const backgroundPresets = {
  solid: (p) => ({ background: p.base }),

  linear: (p, params) => ({
    background: `linear-gradient(${params?.angle ?? 145}deg, ${sw(p, 0)} 0%, ${sw(p, 1, p.base)} 100%)`,
  }),

  pastelMesh: (p) => ({
    background: [
      at(18, 14, sw(p, 0), 52),
      at(85, 18, sw(p, 1, p.accent), 48),
      at(50, 96, sw(p, 2, sw(p, 0)), 54),
      p.base,
    ].join(", "),
  }),

  glassAurora: (p) => ({
    background: [
      at(20, 10, sw(p, 0), 50),
      at(78, 8, sw(p, 1, p.accent), 46),
      at(92, 70, sw(p, 2, sw(p, 0)), 50),
      at(10, 88, sw(p, 3, p.accent), 50),
      p.base,
    ].join(", "),
  }),

  nightGlow: (p) => ({
    background: [
      at(50, 0, sw(p, 0, p.accent), 60),
      at(85, 95, sw(p, 1, p.accent), 45),
      p.base,
    ].join(", "),
  }),

  neonGradient: (p) => ({
    background: [
      at(15, 12, sw(p, 0), 45),
      at(88, 18, sw(p, 1, p.accent), 42),
      at(50, 100, sw(p, 2, sw(p, 0)), 50),
      p.base,
    ].join(", "),
  }),

  skyCloud: (p) => ({
    background: `linear-gradient(180deg, ${sw(p, 0)} 0%, ${sw(p, 1, p.base)} 60%, ${p.base} 100%)`,
  }),

  seasonalFlower: (p) => ({
    background: [
      at(12, 10, sw(p, 0), 40),
      at(90, 14, sw(p, 1, p.accent), 38),
      at(20, 92, sw(p, 2, sw(p, 0)), 42),
      at(82, 88, sw(p, 3, p.accent), 40),
      p.base,
    ].join(", "),
  }),

  /** 가로/세로 격자 (레트로/Y2K) */
  retroGrid: (p) => ({
    backgroundColor: p.base,
    backgroundImage: [
      `linear-gradient(${sw(p, 0, p.accent)}33 1px, transparent 1px)`,
      `linear-gradient(90deg, ${sw(p, 0, p.accent)}33 1px, transparent 1px)`,
      at(50, 110, sw(p, 1, p.accent), 60),
    ].join(", "),
    backgroundSize: "28px 28px, 28px 28px, 100% 100%",
  }),

  /** 종이 질감 느낌의 은은한 결 */
  paperTexture: (p) => ({
    backgroundColor: p.base,
    backgroundImage: [
      `repeating-linear-gradient(135deg, ${sw(p, 0, p.accent)}0a 0px, ${sw(p, 0, p.accent)}0a 2px, transparent 2px, transparent 6px)`,
      at(20, 12, sw(p, 1, sw(p, 0)), 45),
    ].join(", "),
  }),
} as const satisfies Record<string, BackgroundBuilder>;

export type BackgroundPresetKey = keyof typeof backgroundPresets;
