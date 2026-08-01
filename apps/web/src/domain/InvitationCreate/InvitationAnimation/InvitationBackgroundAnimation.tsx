import { GalaxyBackground } from '@/components/invite/GalaxyBackground';
import { WaterBackground } from '@/components/invite/WaterBackground';
import { HologramBackground } from '@/components/invite/HologramBackground';
import { LaserShowBackground } from '@/components/invite/LaserShowBackground';
import { GlassOrbLayer } from '@/components/invite/GlassOrbLayer';

/** bgClass별 배경 애니메이션 컴포넌트 분기 — CreateCanvas/HostView/GuestView 3곳에서 공유 */
export function InvitationBackgroundAnimation({
  bgClass,
  className,
}: {
  bgClass: string;
  className?: string;
}) {
  if (bgClass === 'bg-invite-galaxy') return <GalaxyBackground className={className} />;
  if (bgClass === 'bg-invite-water') return <WaterBackground className={className} />;
  if (bgClass === 'bg-invite-hologram') return <HologramBackground className={className} />;
  if (bgClass === 'bg-invite-lasershow') return <LaserShowBackground className={className} />;
  if (bgClass === 'bg-invite-glass') return <GlassOrbLayer className={className} />;
  if (bgClass === 'bg-invite-glass-dark') return <GlassOrbLayer className={className} tone="dark" />;
  return null;
}
