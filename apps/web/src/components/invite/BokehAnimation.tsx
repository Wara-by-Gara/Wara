'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/cn';
import { advanceTwinkle } from '@/lib/canvasTwinkle';

const BOKEH_COLORS: [number, number, number][] = [
  [255, 232, 224], // #FFE8E0
  [255, 205, 186], // #FFCDBA
  [247, 215, 166], // #F7D7A6
];

interface Bokeh {
  x: number;
  y: number;
  r: number;
  phase: number;
  speed: number;
  color: [number, number, number];
  opacity: number;
  edgeStop: number; // 원형 몸체가 끝나고 페이드가 시작되는 지점 (0~1) — 개체마다 랜덤
}

interface Dust {
  x: number;
  y: number;
  r: number;
  phase: number;
  speed: number;     // 깜빡임 속도 (빠르게)
  vx: number;        // 떠다니는 속도
  vy: number;
  color: [number, number, number];
}

interface Props {
  className?: string;
}

function makeBokeh(W: number, H: number): Bokeh {
  const r = Math.min(W, H) * (0.014 + Math.random() * 0.032); // 화면 크기 기반 대형
  return {
    x: Math.random() * W,
    y: Math.random() * H,
    r,
    phase: Math.random() * Math.PI * 2,
    speed: 0.5 + Math.random() * 1.45,
    color: BOKEH_COLORS[Math.floor(Math.random() * BOKEH_COLORS.length)]!,
    opacity: 0.3 + Math.random() * 0.7, // 개체마다 랜덤한 투명도
    edgeStop: 0.7 + Math.random() * 0.2, // 0.8 중심으로 랜덤
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
    color: BOKEH_COLORS[Math.floor(Math.random() * BOKEH_COLORS.length)]!,
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

    for (let i = 0; i < 16; i++) bokehs.push(makeBokeh(W0, H0));
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
        const bAlpha = advanceTwinkle(b, dt);

        // 주기 끝나서 안 보일 때 새 위치로 재배치 (크리스탈과 동일한 패턴)
        if (bAlpha < 0.01 && Math.sin(b.phase - b.speed * dt) > 0.01) {
          b.x = Math.random() * W;
          b.y = Math.random() * H;
          b.phase = 0;
        }

        if (bAlpha < 0.01) continue;

        const [r, g, bl] = b.color;
        const a = bAlpha * b.opacity;

        // 원형 몸체는 균일하게 채우고, 가장자리 끝부분에서만 투명하게 페이드
        const grad = ctx!.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
        grad.addColorStop(0,           `rgba(${r},${g},${bl},${0.75 * a})`);
        grad.addColorStop(b.edgeStop,  `rgba(${r},${g},${bl},${0.75 * a})`);
        grad.addColorStop(1,           `rgba(${r},${g},${bl},0)`);

        ctx!.fillStyle = grad;
        ctx!.beginPath();
        ctx!.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx!.fill();
      }

      // 먼지 입자 — 떠다니며 빠르게 깜빡임
      for (const d of dusts) {
        d.x += d.vx * dt;
        d.y += d.vy * dt;

        // 화면 경계 wrapping
        if (d.x < -5) d.x = W + 5;
        else if (d.x > W + 5) d.x = -5;
        if (d.y < -5) d.y = H + 5;
        else if (d.y > H + 5) d.y = -5;

        const alpha = advanceTwinkle(d, dt);
        if (alpha < 0.02) continue;

        const [dr, dg, db] = d.color;
        ctx!.globalAlpha = alpha * 0.9;
        ctx!.fillStyle = `rgb(${dr},${dg},${db})`;
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
