'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/cn';

const TINT_COLORS = [
  null,                          // original pink
  'rgba(255, 200,  60, 0.50)',   // yellow
  'rgba( 80, 190, 255, 0.52)',   // sky blue
  'rgba(160, 100, 255, 0.48)',   // lavender
  'rgba( 70, 210, 150, 0.48)',   // mint
  'rgba(255, 130,  50, 0.44)',   // peach/orange
  'rgba(100, 150, 255, 0.48)',   // periwinkle
  'rgba(255,  60, 100, 0.32)',   // hot pink
];

const COUNT = 14;

interface Balloon {
  x: number;
  y: number;
  size: number;
  speed: number;
  driftAmp: number;
  driftFreq: number;
  driftPhase: number;
  t: number;
  tintIdx: number;
  opacity: number;
}

function makeBalloon(seed: number, w: number, h: number, onScreen: boolean): Balloon {
  const r = (salt: number) => ((seed * 9301 + salt * 49297 + 233) % 233280) / 233280;

  const size      = 70 + r(1) * 330;   // 70~400px
  const speed     = (50 + r(2) * 60) * (h / 844);
  const driftAmp  = 10 + r(3) * 25;
  const driftFreq = 0.18 + r(4) * 0.38;
  const driftPhase = r(5) * Math.PI * 2;
  const tintIdx   = seed % TINT_COLORS.length;
  const opacity   = 0.80 + r(6) * 0.20;

  // evenly distribute x across screen width
  const slot = (seed % COUNT) / COUNT;
  const x = (slot + r(7) / COUNT) * w;

  const y = onScreen
    ? r(8) * h * 0.95
    : h + size + r(8) * h * 1.8;

  return { x, y, size, speed, driftAmp, driftFreq, driftPhase, t: r(9) * 20, tintIdx, opacity };
}

/** Build tinted offscreen canvas — run once after image loads */
function buildTinted(img: HTMLImageElement, w: number, h: number, tint: string | null): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  ctx.drawImage(img, 0, 0, w, h);
  if (tint) {
    ctx.globalCompositeOperation = 'source-atop';
    ctx.fillStyle = tint;
    ctx.fillRect(0, 0, w, h);
  }
  return c;
}

export function BalloonAnimation({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = canvas.offsetWidth;
    let h = canvas.offsetHeight;
    canvas.width = w;
    canvas.height = h;

    // tinted image cache: index = tintIdx, value = per-size map or scaled canvas
    let tintedCache: HTMLCanvasElement[] | null = null;

    const img = new window.Image();
    img.onload = () => {
      const aspect = img.naturalWidth / img.naturalHeight;
      // precompute tinted versions at natural size; scale at draw time
      tintedCache = TINT_COLORS.map((tint) =>
        buildTinted(img, img.naturalWidth, img.naturalHeight, tint)
      );
      // store aspect on img for use in tick
      (img as HTMLImageElement & { _aspect: number })._aspect = aspect;
    };
    img.src = '/balloon.png';

    // shuffle indices so x order != y order
    const indices = Array.from({ length: COUNT }, (_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j]!, indices[i]!];
    }
    const ySlot = h * 1.8 / COUNT;
    const balloons: Balloon[] = Array.from({ length: COUNT }, (_, i) => {
      const b = makeBalloon(indices[i]!, w, h, false);
      b.y = h + b.size * 0.5 + i * ySlot + Math.random() * ySlot * 0.6;
      return b;
    });

    const ro = new ResizeObserver(() => {
      w = canvas.offsetWidth;
      h = canvas.offsetHeight;
      canvas.width = w;
      canvas.height = h;
    });
    ro.observe(canvas);

    let lastTime = performance.now();
    let rafId: number;

    function tick(now: number) {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      ctx!.clearRect(0, 0, w, h);

      if (!tintedCache) {
        rafId = requestAnimationFrame(tick);
        return;
      }

      const aspect = (img as HTMLImageElement & { _aspect?: number })._aspect ?? 0.6;

      for (const b of balloons) {
        b.t += dt;
        b.y -= b.speed * dt;
        b.x += Math.sin(b.t * b.driftFreq + b.driftPhase) * b.driftAmp * dt;

        if (b.y < -b.size * 2) {
          const fresh = makeBalloon(Math.floor(Math.random() * 10000), w, h, false);
          fresh.y = h + fresh.size + Math.random() * h * 1.2;
          Object.assign(b, fresh);
        }

        const dw = b.size * aspect;
        const dh = b.size;
        const src = tintedCache[b.tintIdx];

        ctx!.save();
        ctx!.globalAlpha = b.opacity;
        ctx!.drawImage(src, b.x - dw / 2, b.y - dh / 2, dw, dh);
        ctx!.restore();
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
