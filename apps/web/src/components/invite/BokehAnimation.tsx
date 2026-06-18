'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/cn';

const BOKEH_COLORS: [number, number, number][] = [
  [255, 215, 0],
  [255, 237, 138],
  [255, 200, 60],
  [255, 255, 200],
  [255, 170, 40],
];

interface Bokeh {
  x: number;
  y: number;
  r: number;
  phase: number;
  speed: number;
  color: [number, number, number];
  vx: number;
  vy: number;
}

interface Dust {
  x: number;
  y: number;
  r: number;
  phase: number;
  speed: number;     // 깜빡임 속도 (빠르게)
  vx: number;        // 떠다니는 속도
  vy: number;
}

interface Props {
  className?: string;
}

function makeBokeh(W: number, H: number): Bokeh {
  return {
    x: Math.random() * W,
    y: Math.random() * H,
    r: Math.min(W, H) * (0.08 + Math.random() * 0.22), // 화면 크기 기반 대형
    phase: Math.random() * Math.PI * 2,
    speed: 0.2 + Math.random() * 0.4,
    color: BOKEH_COLORS[Math.floor(Math.random() * BOKEH_COLORS.length)]!,
    vx: (Math.random() - 0.5) * 12,
    vy: (Math.random() - 0.5) * 10,
  };
}

function makeDust(W: number, H: number): Dust {
  return {
    x: Math.random() * W,
    y: Math.random() * H,
    r: 0.8 + Math.random() * 2.2,
    phase: Math.random() * Math.PI * 2,
    speed: 1.2 + Math.random() * 3.0,   // 빠른 깜빡임
    vx: (Math.random() - 0.5) * 25,     // 떠다니는 속도
    vy: (Math.random() - 0.5) * 18,
  };
}

export function BokehAnimation({ className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let destroyed = false;
    let frameId: number;
    let lastTime = performance.now();

    const bokehs: Bokeh[] = [];
    const dusts: Dust[] = [];

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

    for (let i = 0; i < 10; i++) bokehs.push(makeBokeh(W0, H0));
    for (let i = 0; i < 90; i++) dusts.push(makeDust(W0, H0));

    function animate(now: number) {
      if (destroyed) return;
      frameId = requestAnimationFrame(animate);

      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      const W = canvas!.offsetWidth;
      const H = canvas!.offsetHeight;

      ctx!.clearRect(0, 0, W, H);

      // 대형 소프트 보케
      for (const b of bokehs) {
        b.phase += b.speed * dt;
        b.x += b.vx * dt;
        b.y += b.vy * dt;

        // 화면 밖으로 나가면 반대편에서 재진입
        if (b.x < -b.r * 2) b.x = W + b.r;
        else if (b.x > W + b.r * 2) b.x = -b.r;
        if (b.y < -b.r * 2) b.y = H + b.r;
        else if (b.y > H + b.r * 2) b.y = -b.r;

        const sinVal = 0.4 + 0.6 * Math.max(0, Math.sin(b.phase));
        const [r, g, bl] = b.color;

        // 중심부터 투명까지 넓고 부드럽게
        const grad = ctx!.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
        grad.addColorStop(0,    `rgba(${r},${g},${bl},${0.45 * sinVal})`);
        grad.addColorStop(0.30, `rgba(${r},${g},${bl},${0.32 * sinVal})`);
        grad.addColorStop(0.65, `rgba(${r},${g},${bl},${0.12 * sinVal})`);
        grad.addColorStop(1,    `rgba(${r},${g},${bl},0)`);

        ctx!.fillStyle = grad;
        ctx!.beginPath();
        ctx!.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx!.fill();
      }

      // 먼지 입자 — 떠다니며 빠르게 깜빡임
      for (const d of dusts) {
        d.phase += d.speed * dt;
        d.x += d.vx * dt;
        d.y += d.vy * dt;

        // 화면 경계 wrapping
        if (d.x < -5) d.x = W + 5;
        else if (d.x > W + 5) d.x = -5;
        if (d.y < -5) d.y = H + 5;
        else if (d.y > H + 5) d.y = -5;

        const alpha = Math.max(0, Math.sin(d.phase));
        if (alpha < 0.02) continue;

        ctx!.globalAlpha = alpha * 0.9;
        ctx!.fillStyle = '#ffd700';
        ctx!.beginPath();
        ctx!.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx!.fill();
        ctx!.globalAlpha = 1;
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
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={cn('absolute inset-0 w-full h-full pointer-events-none', className)}
    />
  );
}
