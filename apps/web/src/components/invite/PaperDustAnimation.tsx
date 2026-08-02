'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/cn';
import { advanceTwinkle } from '@/lib/canvasTwinkle';

const DUST_COLORS: [number, number, number][] = [
  [243, 229, 208], // #F3E5D0
  [232, 207, 160], // #E8CFA0
  [255, 246, 232], // #FFF6E8
];

const COUNT = 55;

interface Dust {
  x: number;
  y: number;
  r: number;
  phase: number;
  speed: number;
  vx: number;
  vy: number;
  color: [number, number, number];
}

function makeDust(W: number, H: number): Dust {
  return {
    x: Math.random() * W,
    y: Math.random() * H,
    r: 1.5 + Math.random() * 3.5,
    phase: Math.random() * Math.PI * 2,
    speed: 0.5 + Math.random() * 1.0,
    vx: (Math.random() - 0.5) * 8,
    vy: -3 - Math.random() * 6,
    color: DUST_COLORS[Math.floor(Math.random() * DUST_COLORS.length)]!,
  };
}

interface Props {
  className?: string;
}

export function PaperDustAnimation({ className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let W = canvas.offsetWidth;
    let H = canvas.offsetHeight;
    canvas.width = W;
    canvas.height = H;

    const dust: Dust[] = Array.from({ length: COUNT }, () => makeDust(W, H));

    const ro = new ResizeObserver(() => {
      W = canvas.offsetWidth;
      H = canvas.offsetHeight;
      canvas.width = W;
      canvas.height = H;
    });
    ro.observe(canvas);

    let lastTime = performance.now();
    let rafId: number;

    function tick(now: number) {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      ctx!.clearRect(0, 0, W, H);

      for (const d of dust) {
        const alpha = advanceTwinkle(d, dt);
        d.x += d.vx * dt;
        d.y += d.vy * dt;
        if (d.y < -10 || d.x < -10 || d.x > W + 10) {
          Object.assign(d, makeDust(W, H), { y: H + 10 });
        }
        const [r, g, b] = d.color;
        ctx!.globalAlpha = alpha * 0.55;
        ctx!.fillStyle = `rgb(${r},${g},${b})`;
        ctx!.beginPath();
        ctx!.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx!.fill();
      }

      rafId = requestAnimationFrame(tick);
    }

    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={cn('pointer-events-none', className)}
      style={{ width: '100%', height: '100%' }}
    />
  );
}
