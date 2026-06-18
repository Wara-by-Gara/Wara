'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/cn';

const COLORS = [
  '#c9b8ff', '#a8d8ff', '#ffb3de', '#b3fff0',
  '#ffffff', '#e8c9ff', '#b8f0ff', '#ffc8e8',
  '#d4aaff', '#aaeeff',
];

const DEFAULT_COUNT = 250;

interface Sparkle {
  x: number;
  y: number;
  size: number;
  phase: number;       // 현재 위상 (0~2π)
  speed: number;       // 반짝임 속도
  color: string;
  rotation: number;    // 4-point star 회전각
}

interface Props {
  className?: string;
  count?: number;
}

function makeSparkle(W: number, H: number): Sparkle {
  return {
    x: Math.random() * W,
    y: Math.random() * H,
    size: 3 + Math.random() * 11,
    phase: Math.random() * Math.PI * 2,
    speed: 0.8 + Math.random() * 2.5,
    color: COLORS[Math.floor(Math.random() * COLORS.length)]!,
    rotation: Math.random() * Math.PI * 0.5,
  };
}

/** 4-point star (lens flare sparkle) */
function drawSparkle(ctx: CanvasRenderingContext2D, size: number, rotation: number) {
  ctx.save();
  ctx.rotate(rotation);
  const ray = size;
  const w = size * 0.10;
  // 메인 십자 (수직·수평)
  ctx.beginPath();
  ctx.ellipse(0, 0, w, ray, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(0, 0, ray, w, 0, 0, Math.PI * 2);
  ctx.fill();
  // 대각 (45도, 짧게)
  ctx.rotate(Math.PI / 4);
  ctx.beginPath();
  ctx.ellipse(0, 0, w * 0.7, ray * 0.55, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(0, 0, ray * 0.55, w * 0.7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function CrystalGlitterAnimation({ className, count = DEFAULT_COUNT }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let destroyed = false;
    let frameId: number;
    let lastTime = performance.now();

    const sparkles: Sparkle[] = [];

    function resize() {
      const dpr = Math.min(window.devicePixelRatio, 2);
      const W = canvas!.offsetWidth;
      const H = canvas!.offsetHeight;
      canvas!.width = W * dpr;
      canvas!.height = H * dpr;
      ctx!.scale(dpr, dpr);
    }

    resize();

    const W0 = canvas.offsetWidth;
    const H0 = canvas.offsetHeight;
    for (let i = 0; i < count; i++) {
      sparkles.push(makeSparkle(W0, H0));
    }

    function animate(now: number) {
      if (destroyed) return;
      frameId = requestAnimationFrame(animate);

      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      const W = canvas!.offsetWidth;
      const H = canvas!.offsetHeight;

      ctx!.clearRect(0, 0, W, H);

      for (const s of sparkles) {
        s.phase += s.speed * dt;

        // sin → 0~1 범위, 음수 구간은 0 처리 (off 상태)
        const alpha = Math.max(0, Math.sin(s.phase));

        // alpha가 한 주기 끝나서 0으로 돌아오면 새 위치로 이동
        if (alpha < 0.01 && Math.sin(s.phase - s.speed * dt) > 0.01) {
          s.x = Math.random() * W;
          s.y = Math.random() * H;
          s.color = COLORS[Math.floor(Math.random() * COLORS.length)]!;
          s.size = 3 + Math.random() * 11;
          s.phase = 0;
        }

        if (alpha < 0.01) continue;

        ctx!.save();
        ctx!.translate(s.x, s.y);
        ctx!.globalAlpha = alpha;
        ctx!.fillStyle = s.color;

        drawSparkle(ctx!, s.size * alpha, s.rotation);

        // 중심 흰 점
        ctx!.fillStyle = '#ffffff';
        ctx!.globalAlpha = alpha * 0.9;
        ctx!.beginPath();
        ctx!.arc(0, 0, s.size * 0.18, 0, Math.PI * 2);
        ctx!.fill();

        ctx!.restore();
      }
    }

    frameId = requestAnimationFrame(animate);

    const ro = new ResizeObserver(() => {
      if (!destroyed) resize();
    });
    ro.observe(canvas);

    return () => {
      destroyed = true;
      cancelAnimationFrame(frameId);
      ro.disconnect();
    };
  }, [count]);

  return (
    <canvas
      ref={canvasRef}
      className={cn('absolute inset-0 w-full h-full pointer-events-none', className)}
    />
  );
}
