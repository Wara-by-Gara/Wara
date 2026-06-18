'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/cn';

const STREAM_COLORS: [number, number, number][] = [
  [180, 100, 255],
  [210, 160, 255],
  [240, 210, 255],
  [200, 130, 255],
  [255, 255, 255],
];

const GLOW_LAYERS = 14;

interface Stream {
  // cubic bezier: start → cp1 → cp2 → end
  sx: number; sy: number;
  ex: number; ey: number;
  cp1x0: number; cp1y0: number;
  cp2x0: number; cp2y0: number;
  // 수직 방향 oscillation
  perpX: number; perpY: number;
  phase: number;
  speed: number;
  amplitude: number;
  width: number;
  maxAlpha: number;
  color: [number, number, number];
  brightPhase: number;
  brightSpeed: number;
}

interface Star {
  x: number; y: number;
  size: number;
  phase: number;
  speed: number;
  cross: boolean;
}

interface Props {
  className?: string;
  starsOnly?: boolean;
}

function makeStream(index: number, total: number, W: number, H: number): Stream {
  // 오로라처럼 대각선으로 흐름: 왼쪽 하단 → 오른쪽 상단 방향
  const t = index / Math.max(total - 1, 1);
  const startY = H * (0.25 + t * 0.65);
  const startX = -W * 0.15;
  const rise = H * (0.15 + Math.random() * 0.35); // 오른쪽 갈수록 올라가는 정도
  const endX = W * 1.15;
  const endY = startY - rise;

  // 중간 두 제어점 (1/3, 2/3 위치 기준)
  const cp1x0 = startX + (endX - startX) * 0.33;
  const cp1y0 = startY + (endY - startY) * 0.33;
  const cp2x0 = startX + (endX - startX) * 0.67;
  const cp2y0 = startY + (endY - startY) * 0.67;

  // 스트림에 수직인 방향 (normal vector)
  const dx = endX - startX;
  const dy = endY - startY;
  const len = Math.sqrt(dx * dx + dy * dy);
  const perpX = -dy / len;
  const perpY = dx / len;

  return {
    sx: startX, sy: startY, ex: endX, ey: endY,
    cp1x0, cp1y0, cp2x0, cp2y0,
    perpX, perpY,
    phase: Math.random() * Math.PI * 2,
    speed: 0.15 + Math.random() * 0.30,
    amplitude: H * (0.04 + Math.random() * 0.08),
    width: 80 + Math.random() * 120,
    maxAlpha: 0.28 + Math.random() * 0.32,
    color: STREAM_COLORS[index % STREAM_COLORS.length]!,
    brightPhase: Math.random() * Math.PI * 2,
    brightSpeed: 0.08 + Math.random() * 0.18,
  };
}

function makeStar(W: number, H: number): Star {
  return {
    x: Math.random() * W,
    y: Math.random() * H,
    size: Math.random() < 0.25 ? 3 + Math.random() * 7 : 1 + Math.random() * 2,
    phase: Math.random() * Math.PI * 2,
    speed: 0.8 + Math.random() * 2.5,
    cross: Math.random() < 0.2,
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

export function AuroraAnimation({ className, starsOnly = false }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let destroyed = false;
    let frameId: number;
    let lastTime = performance.now();

    const streams: Stream[] = [];
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

    if (!starsOnly) {
      for (let i = 0; i < 5; i++) streams.push(makeStream(i, 5, W0, H0));
    }
    for (let i = 0; i < 100; i++) stars.push(makeStar(W0, H0));

    function animate(now: number) {
      if (destroyed) return;
      frameId = requestAnimationFrame(animate);

      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      const W = canvas!.offsetWidth;
      const H = canvas!.offsetHeight;
      ctx!.clearRect(0, 0, W, H);
      ctx!.lineCap = 'round';
      ctx!.lineJoin = 'round';

      // 대각 오로라 스트림
      if (!starsOnly) {
        for (const s of streams) {
          s.phase += s.speed * dt;
          s.brightPhase += s.brightSpeed * dt;

          // 두 제어점을 수직 방향으로 다르게 oscillation → S커브
          const off1 = Math.sin(s.phase) * s.amplitude;
          const off2 = Math.sin(s.phase + Math.PI * 0.65) * s.amplitude;

          const cp1x = s.cp1x0 + s.perpX * off1;
          const cp1y = s.cp1y0 + s.perpY * off1;
          const cp2x = s.cp2x0 + s.perpX * off2;
          const cp2y = s.cp2y0 + s.perpY * off2;

          const bright = 0.65 + 0.35 * Math.abs(Math.sin(s.brightPhase));
          const [r, g, b] = s.color;

          // 경로 한 번만 정의, N회 stroke (글로우 레이어)
          ctx!.beginPath();
          ctx!.moveTo(s.sx, s.sy);
          ctx!.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, s.ex, s.ey);

          for (let layer = 0; layer < GLOW_LAYERS; layer++) {
            const t = layer / (GLOW_LAYERS - 1);
            const lineW = s.width * (1 - t * 0.90);
            const alpha = Math.pow(t, 1.3) * s.maxAlpha * bright;
            ctx!.lineWidth = lineW;
            ctx!.strokeStyle = `rgba(${r},${g},${b},${alpha})`;
            ctx!.stroke();
          }
        }
      }

      // 별
      for (const st of stars) {
        st.phase += st.speed * dt;
        const alpha = Math.max(0, Math.sin(st.phase));
        if (alpha < 0.02) continue;

        ctx!.save();
        ctx!.translate(st.x, st.y);
        ctx!.globalAlpha = alpha;
        ctx!.fillStyle = '#ffffff';

        if (st.cross) {
          drawCross(ctx!, st.size * alpha);
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
  }, [starsOnly]);

  return (
    <canvas
      ref={canvasRef}
      className={cn('absolute inset-0 w-full h-full pointer-events-none', className)}
    />
  );
}
