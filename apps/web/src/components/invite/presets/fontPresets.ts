/**
 * 제목 글꼴 프리셋 (Font 축) — Partiful: Classic / Eclectic / Fancy / Simple.
 * 초대장 제목 분위기를 글꼴로 전환. WARA `invitation.font` 값과 매핑.
 * 한글 대응 스택 + 제네릭 폴백(전용 폰트 파일은 추후 @font-face로 보강 가능).
 */
export interface FontPreset {
  /** 제목용 font-family 스택 */
  fontFamily: string;
  /** 제목 letter-spacing(em) 미세 조정 */
  tracking?: string;
}

export const fontPresets = {
  classic: {
    fontFamily: "'Pretendard', system-ui, sans-serif",
  },
  eclectic: {
    // 세리프 — 시스템 한글 명조로 폴백
    fontFamily: "'Nanum Myeongjo', 'Apple SD Gothic Neo', Georgia, serif",
  },
  fancy: {
    // 손글씨/필기 — 폴백 cursive
    fontFamily: "'Gaegu', 'Pretendard', cursive",
    tracking: "0.01em",
  },
  simple: {
    fontFamily: "'Pretendard', system-ui, sans-serif",
    tracking: "-0.01em",
  },
} as const satisfies Record<string, FontPreset>;

export type FontPresetKey = keyof typeof fontPresets;

/** WARA invitation.font(문자열) → 프리셋 키 (미지정/미일치 시 classic) */
export function resolveFontPreset(font?: string | null): FontPreset {
  const key = (font ?? "").toLowerCase() as FontPresetKey;
  return fontPresets[key] ?? fontPresets.classic;
}
