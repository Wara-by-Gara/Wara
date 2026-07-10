/**
 * 초대장 배경 테마 시스템 — 웹 초대장 상세의 배경/폰트/애니메이션 효과를 RN으로 재현.
 * 사용: 초대장 캔버스 최하단 레이어에 <InvitationThemeBackground bgColor={...} />,
 * 그 위에 <InvitationAnimationLayer animation={...} /> / <CherryBlossomEffect title={...} />.
 */

export { InvitationThemeBackground } from './InvitationThemeBackground';
export { InvitationAnimationLayer } from './InvitationAnimationLayer';
export { CherryBlossomEffect, hasCherryBlossomEffect } from './CherryBlossomEffect';
export {
  getGradientVariant,
  invitationFontStyle,
  isDarkInvitationBg,
  resolveInvitationBgTheme,
  GRADIENT_BG_VARIANTS,
  INVITATION_FONT_STYLES,
  INVITE_BG_THEME_IDS,
} from '@/constants/invitationTheme';
export type { GradientVariant, InviteBgThemeId } from '@/constants/invitationTheme';
