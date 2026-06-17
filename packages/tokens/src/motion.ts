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
