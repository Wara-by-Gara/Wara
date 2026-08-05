import { cn } from '@/lib/cn';

/** 글래스 배경(bg-invite-glass / bg-invite-glass-dark) 전용 — 색 덩어리가 은은하게 떠다니며
 * 유리 뒤로 빛이 번지는 느낌을 준다. `.grad-orb`/`grad-floatA`/`grad-floatB`는
 * 커스텀 컬러 배경용으로 정의됐지만 실제로는 쓰이지 않던 CSS라 여기서 재사용한다.
 * `mix-blend-mode: screen`은 밝은(흰색) 배경 위에서는 거의 안 보이고, 어두운 배경 위에서
 * 훨씬 또렷하게 빛나 보인다 — 다크 글래스가 네온/보석톤을 쓰는 이유. */
const ORB_LAYOUT = [
  { left: '4%', top: '8%', size: '38%', path: 'a', duration: 5, delay: 0 },
  { right: '2%', top: '4%', size: '32%', path: 'b', duration: 6, delay: -1 },
  { left: '30%', top: '20%', size: '42%', path: 'a', duration: 5.6, delay: -2.1 },
  { right: '12%', bottom: '30%', size: '36%', path: 'b', duration: 5.3, delay: -0.7 },
  { left: '6%', bottom: '8%', size: '36%', path: 'a', duration: 6.7, delay: -2.8 },
  { right: '6%', bottom: '4%', size: '30%', path: 'b', duration: 5.6, delay: -1.8 },
  { left: '46%', bottom: '2%', size: '34%', path: 'a', duration: 7, delay: -3.5 },
  { right: '28%', top: '12%', size: '40%', path: 'a', duration: 6, delay: -1.4 },
] as const;

const LIGHT_COLORS = [
  '#bcd4ff', '#ffd6ec', '#e0c9ff', '#c8f5e3', '#ffe6b3',
  '#cdeaff', '#ffc9d9', '#b3f0e5',
];

const DARK_COLORS = [
  '#00c8ff', '#ff2ec4', '#b026ff', '#00e6a8', '#ffd400',
  '#22e0e0', '#ff2954', '#14f1d9',
];

export function GlassOrbLayer({
  className,
  tone = 'light',
}: {
  className?: string;
  tone?: 'light' | 'dark';
}) {
  const colors = tone === 'dark' ? DARK_COLORS : LIGHT_COLORS;
  return (
    <div aria-hidden className={cn('overflow-hidden', className)}>
      {ORB_LAYOUT.map((orb, i) => (
        <div
          key={i}
          className={cn('grad-orb', orb.path === 'a' ? 'grad-orb-a' : 'grad-orb-b')}
          style={{
            left: 'left' in orb ? orb.left : undefined,
            right: 'right' in orb ? orb.right : undefined,
            top: 'top' in orb ? orb.top : undefined,
            bottom: 'bottom' in orb ? orb.bottom : undefined,
            width: orb.size,
            height: orb.size,
            backgroundColor: colors[i],
            animationDuration: `${orb.duration}s`,
            animationDelay: `${orb.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
