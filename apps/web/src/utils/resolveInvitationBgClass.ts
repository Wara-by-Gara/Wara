import {
  DEFAULT_BG_COLOR,
  DESIGN_BG_THEMES,
} from "@/domain/InvitationCreate/constants";

const INVITE_BG_CLASSES = new Set<string>(
  DESIGN_BG_THEMES.map((theme) => theme.cls),
);

/** API bgColor → 적용 가능한 테마 클래스 */
export function resolveInvitationBgClass(bgColor?: string | null): string {
  if (bgColor && INVITE_BG_CLASSES.has(bgColor)) {
    return bgColor;
  }
  return DEFAULT_BG_COLOR;
}
