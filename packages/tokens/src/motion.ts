/** 모션 — duration·easing. 초대장 모션 preset도 이 값을 기준으로 한다. */
export const duration = {
  fast: "120ms",
  base: "200ms",
  slow: "320ms",
  slower: "480ms",
} as const;

export const easing = {
  standard: "cubic-bezier(0.2, 0, 0, 1)",
  decelerate: "cubic-bezier(0, 0, 0, 1)",
  accelerate: "cubic-bezier(0.3, 0, 1, 1)",
  emphasized: "cubic-bezier(0.16, 1, 0.3, 1)",
} as const;

/**
 * 스프링 파라미터 — framer-motion 시드의 값 SoT (CSS 미emit, TS 전용).
 * 앱 셸 모션 시드(Spring/Pulse/축하)가 이 값으로 Transition을 구성한다.
 *  default 통통·에너제틱(버튼/토스트/성공) · gentle 부드러운 진입 · bouncy 크게 통통(축하)
 */
export const spring = {
  default: { stiffness: 420, damping: 30, mass: 0.9 },
  gentle: { stiffness: 260, damping: 26, mass: 1 },
  bouncy: { stiffness: 500, damping: 18, mass: 0.8 },
} as const;
