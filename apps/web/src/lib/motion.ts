/**
 * 앱 셸 모션 시드 — StyleSeed 보캐뷸러리 차용 (framer-motion 프리셋).
 * 값 SoT는 @wara/tokens (`spring`·`duration`·`easing`). 매직넘버 금지.
 *
 * 가드레일 (docs/design-system/04-styleseed-adoption.md):
 *  - payload(메시지·카운트·리스트·검색결과)는 절대 모션 지연 금지
 *  - opacity/transform/box-shadow만 애니메이트
 *  - prefers-reduced-motion 존중 (소비처에서 framer-motion useReducedMotion 분기)
 *  - 진입 stagger는 첫 마운트 섹션 컨테이너(chrome)에만
 *
 * 초대장 캔버스 모션은 별개: components/invite/presets/motionPresets.ts.
 */
import type { Transition, Variants } from "framer-motion";
import { spring as springParams, duration, easing } from "@wara/tokens";

/** "120ms" → 0.12 (framer-motion은 초 단위) */
const sec = (v: string) => parseFloat(v) / 1000;

/** "cubic-bezier(a,b,c,d)" → [a,b,c,d] (framer-motion ease 배열) */
const bezier = (css: string): [number, number, number, number] => {
  const m = css.match(/cubic-bezier\(([^)]+)\)/);
  const n = m?.[1]?.split(",").map((s) => parseFloat(s.trim()));
  return n && n.length === 4
    ? [n[0]!, n[1]!, n[2]!, n[3]!]
    : [0.2, 0, 0, 1];
};

const easeEmphasized = bezier(easing.emphasized);

/**
 * Spring (메인) — 통통·에너제틱. 버튼/토스트/성공 상태.
 *  default 기본 · gentle 부드러운 진입 · bouncy 크게 통통(축하)
 */
export const spring = {
  default: { type: "spring", ...springParams.default } satisfies Transition,
  gentle: { type: "spring", ...springParams.gentle } satisfies Transition,
  bouncy: { type: "spring", ...springParams.bouncy } satisfies Transition,
};

/** 진입 stagger — 부모 컨테이너에 `pageStagger`, 각 섹션 아이템에 `pageItem`. */
export const pageStagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};

export const pageItem: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: sec(duration.base), ease: easeEmphasized },
  },
};

/** Pulse — 상태 dot(알림 unread 등). 리드미컬·생동. */
export const pulse: Variants = {
  idle: { scale: 1, opacity: 1 },
  pulse: {
    scale: [1, 1.25, 1],
    opacity: [1, 0.7, 1],
    transition: { duration: 1.6, repeat: Infinity, ease: "easeInOut" },
  },
};

/** 축하 — confetti-pop: 스프링으로 팝업 등장 (RSVP 확정 등). */
export const confettiPop: Variants = {
  hidden: { scale: 0, opacity: 0 },
  show: { scale: 1, opacity: 1, transition: spring.bouncy },
};

/** 축하 — glow-pulse: 화이트 글로우 1회 (inset — 원 안쪽에서만 번져 경계 밖으로 안 나감). */
export const glowPulse: Variants = {
  idle: { boxShadow: "inset 0 0 0 0 rgba(255,255,255,0)" },
  glow: {
    boxShadow: [
      "inset 0 0 14px 3px rgba(255,255,255,0.85)",
      "inset 0 0 0 0 rgba(255,255,255,0)",
    ],
    transition: { duration: 0.9, ease: "easeOut" },
  },
};
