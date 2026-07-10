/**
 * 초대장 배경 테마 디스패처 — 웹 GuestView/HostView 의 배경 레이어 스택 미러.
 * bgColor(API 문자열) → 그라데이션 변형 / 테마별 배경 컴포넌트. 미지정/미매핑은 null.
 */

import { getGradientVariant, resolveInvitationBgTheme } from '@/constants/invitationTheme';

import { BlackCatGridBackground } from './BlackCatGridBackground';
import { GalaxyBackground } from './GalaxyBackground';
import { GradientSceneBackground } from './GradientSceneBackground';
import { HologramBackground } from './HologramBackground';
import { LaserShowBackground } from './LaserShowBackground';
import { MasterpieceBackground } from './MasterpieceBackground';
import { StaticThemeBackground } from './StaticThemeBackground';
import { WaterBackground } from './WaterBackground';

export function InvitationThemeBackground({ bgColor }: { bgColor: string }) {
  const gradientVariant = getGradientVariant(bgColor);
  if (gradientVariant) return <GradientSceneBackground variant={gradientVariant} />;

  const themeId = resolveInvitationBgTheme(bgColor);
  if (!themeId) return null;

  switch (themeId) {
    case 'galaxy':
      return <GalaxyBackground />;
    case 'water':
      return <WaterBackground />;
    case 'hologram':
      return <HologramBackground />;
    case 'lasershow':
      return <LaserShowBackground />;
    case 'blackcat':
      return <BlackCatGridBackground />;
    case 'masterpiece':
      return <MasterpieceBackground />;
    default:
      return <StaticThemeBackground themeId={themeId} />;
  }
}
