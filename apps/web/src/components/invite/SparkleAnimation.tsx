'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/cn';
import { advanceTwinkle } from '@/lib/canvasTwinkle';

const DEFAULT_COUNT = 100;

type Shape = 'cross' | 'circle' | 'sixPoint';

interface Star {
  x: number; y: number;
  size: number;
  phase: number;
  speed: number;
  shape: Shape;
  color: string;
  opacity: number;
}

interface Props {
  className?: string;
  count?: number;
  shape?: Shape;
  colors?: string[];
  sizeScale?: number;
  opacityRange?: [number, number];
  speedRange?: [number, number];
}

const DEFAULT_COLORS = ['#ffffff'];
const DEFAULT_OPACITY_RANGE: [number, number] = [1, 1];
const DEFAULT_SPEED_RANGE: [number, number] = [0.8, 3.3];

function makeStar(
  W: number,
  H: number,
  shape: Shape,
  colors: string[],
  sizeScale: number,
  opacityRange: [number, number],
  speedRange: [number, number],
): Star {
  return {
    x: Math.random() * W,
    y: Math.random() * H,
    size: (shape === 'circle' ? 1 + Math.random() * 3 : 6 + Math.random() * 9) * sizeScale,
    phase: Math.random() * Math.PI * 2,
    speed: speedRange[0] + Math.random() * (speedRange[1] - speedRange[0]),
    shape,
    color: colors[Math.floor(Math.random() * colors.length)] ?? '#ffffff',
    opacity: opacityRange[0] + Math.random() * (opacityRange[1] - opacityRange[0]),
  };
}

function drawCross(ctx: CanvasRenderingContext2D, size: number) {
  const w = size * 0.10;
  ctx.beginPath();
  ctx.ellipse(0, 0, w, size, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(0, 0, size, w, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.save();
  ctx.rotate(Math.PI / 4);
  ctx.beginPath();
  ctx.ellipse(0, 0, w * 0.7, size * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(0, 0, size * 0.5, w * 0.7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** 6방향 축(60° 간격) — ✶ 스타일 */
function drawSixPointStar(ctx: CanvasRenderingContext2D, size: number) {
  const w = size * 0.12;
  for (let i = 0; i < 3; i++) {
    ctx.save();
    ctx.rotate((Math.PI / 3) * i);
    ctx.beginPath();
    ctx.ellipse(0, 0, w, size, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export function SparkleAnimation({
  className,
  count = DEFAULT_COUNT,
  shape = 'cross',
  colors = DEFAULT_COLORS,
  sizeScale = 1,
  opacityRange = DEFAULT_OPACITY_RANGE,
  speedRange = DEFAULT_SPEED_RANGE,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let destroyed = false;
    let frameId: number;
    let lastTime = performance.now();

    const stars: Star[] = [];

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

    for (let i = 0; i < count; i++) stars.push(makeStar(W0, H0, shape, colors, sizeScale, opacityRange, speedRange));

    function animate(now: number) {
      if (destroyed) return;
      frameId = requestAnimationFrame(animate);

      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      const W = canvas!.offsetWidth;
      const H = canvas!.offsetHeight;
      ctx!.clearRect(0, 0, W, H);

      for (const st of stars) {
        const alpha = advanceTwinkle(st, dt);
        if (alpha < 0.02) continue;

        ctx!.save();
        ctx!.translate(st.x, st.y);
        ctx!.globalAlpha = alpha * st.opacity;
        ctx!.fillStyle = st.color;

        if (st.shape === 'cross') {
          drawCross(ctx!, st.size * alpha);
        } else if (st.shape === 'sixPoint') {
          drawSixPointStar(ctx!, st.size * alpha);
        } else {
          ctx!.beginPath();
          ctx!.arc(0, 0, st.size, 0, Math.PI * 2);
          ctx!.fill();
        }
        ctx!.restore();
      }
    }

    frameId = requestAnimationFrame(animate);

    const ro = new ResizeObserver(() => { if (!destroyed) resize(); });
    ro.observe(canvas);

    return () => {
      destroyed = true;
      cancelAnimationFrame(frameId);
      ro.disconnect();
    };
  }, [count, shape, colors, sizeScale, opacityRange, speedRange]);

  return (
    <canvas
      ref={canvasRef}
      className={cn('absolute inset-0 w-full h-full pointer-events-none', className)}
    />
  );
}
