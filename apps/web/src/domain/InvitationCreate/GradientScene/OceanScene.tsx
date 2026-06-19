'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/cn';

// 파도 레이어: y비율·진폭·파장배율·속도·RGB·불투명도
const WAVE_LAYERS = [
  { y: 0.42, amp: 0.040, wl: 0.65, spd: 0.35, rgb: [2,   119, 189] as const, alpha: 0.90 },
  { y: 0.52, amp: 0.035, wl: 0.50, spd: 0.55, rgb: [0,   151, 167] as const, alpha: 0.85 },
  { y: 0.61, amp: 0.030, wl: 0.80, spd: 0.30, rgb: [0,   172, 193] as const, alpha: 0.80 },
  { y: 0.69, amp: 0.028, wl: 0.40, spd: 0.75, rgb: [38,  198, 218] as const, alpha: 0.78 },
  { y: 0.77, amp: 0.022, wl: 0.55, spd: 1.00, rgb: [77,  208, 225] as const, alpha: 0.72 },
  { y: 0.86, amp: 0.016, wl: 0.30, spd: 1.30, rgb: [224, 247, 250] as const, alpha: 0.65 },
] as const;

const NUM_SPARKLES = 35;

// 4개 주파수 합성 → 비주기적 유기적 파형
function computeWaveY(x: number, baseY: number, amp: number, freq: number, phase: number) {
  return (
    baseY +
    amp        * Math.sin(freq        * x + phase) +
    amp * 0.45 * Math.sin(freq * 1.7  * x + phase * 1.25) +
    amp * 0.22 * Math.sin(freq * 2.5  * x + phase * 0.65) +
    amp * 0.10 * Math.sin(freq * 3.85 * x + phase * 1.80)
  );
}

function drawScene(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  sparkles: { x: number; y: number; phase: number; speed: number; size: number }[],
  t: number,
) {
  ctx.clearRect(0, 0, w, h);

  // 하늘 → 수평선 그라데이션 (상단 37%)
  const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.38);
  skyGrad.addColorStop(0,    '#87ceeb');
  skyGrad.addColorStop(0.45, '#4fc3f7');
  skyGrad.addColorStop(0.75, '#0288d1');
  skyGrad.addColorStop(1,    '#01579b');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, w, h * 0.38);

  // 바다 본체 그라데이션 (하단 65%)
  const seaGrad = ctx.createLinearGradient(0, h * 0.35, 0, h);
  seaGrad.addColorStop(0,    '#0277bd');
  seaGrad.addColorStop(0.22, '#006994');
  seaGrad.addColorStop(0.50, '#00838f');
  seaGrad.addColorStop(0.75, '#00acc1');
  seaGrad.addColorStop(1,    '#26c6da');
  ctx.fillStyle = seaGrad;
  ctx.fillRect(0, h * 0.35, w, h * 0.65);

  // 파도 레이어 (뒤에서 앞으로)
  for (const layer of WAVE_LAYERS) {
    const baseY = layer.y * h;
    const amp   = layer.amp * h;
    const freq  = (2 * Math.PI) / (layer.wl * w);
    const phase = t * layer.spd * 2;
    const [r, g, b] = layer.rgb;

    // 파도 면
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let x = 0; x <= w; x += 2) {
      ctx.lineTo(x, computeWaveY(x, baseY, amp, freq, phase));
    }
    ctx.lineTo(w, h);
    ctx.closePath();

    const grad = ctx.createLinearGradient(0, baseY - amp, 0, baseY + amp * 2);
    grad.addColorStop(0,    `rgba(${r},${g},${b},${layer.alpha * 0.3})`);
    grad.addColorStop(0.2,  `rgba(${r},${g},${b},${layer.alpha})`);
    grad.addColorStop(1,    `rgba(${r},${g},${b},${layer.alpha})`);
    ctx.fillStyle = grad;
    ctx.fill();

    // 거품선
    ctx.beginPath();
    for (let x = 0; x <= w; x += 2) {
      const y = computeWaveY(x, baseY, amp, freq, phase);
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = `rgba(255,255,255,${layer.alpha * 0.5})`;
    ctx.lineWidth = layer.y < 0.72 ? 2 : 1;
    ctx.stroke();
  }

  // 수면 반짝임
  for (const sp of sparkles) {
    const alpha = ((Math.sin(sp.phase + t * sp.speed) + 1) / 2) ** 2;
    ctx.beginPath();
    ctx.arc(sp.x * w, sp.y * h, sp.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${alpha * 0.9})`;
    ctx.fill();
  }
}

export function OceanScene({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
    let raf = 0;
    let t0: number | null = null;

    const sparkles = Array.from({ length: NUM_SPARKLES }, () => ({
      x: Math.random(),
      y: 0.4 + Math.random() * 0.55,
      phase: Math.random() * Math.PI * 2,
      speed: 1.5 + Math.random() * 2.5,
      size: 0.8 + Math.random() * 1.4,
    }));

    function resize() {
      const el = canvasRef.current;
      if (!el) return;
      const dpr = window.devicePixelRatio || 1;
      const w = el.clientWidth  || el.offsetWidth  || window.innerWidth;
      const h = el.clientHeight || el.offsetHeight || window.innerHeight;
      el.width  = w * dpr;
      el.height = h * dpr;
      ctx.scale(dpr, dpr);
    }

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    function getSize() {
      const el = canvasRef.current;
      return {
        w: el ? (el.clientWidth  || el.offsetWidth  || window.innerWidth)  : window.innerWidth,
        h: el ? (el.clientHeight || el.offsetHeight || window.innerHeight) : window.innerHeight,
      };
    }

    function frame(ts: number) {
      if (!t0) t0 = ts;
      const { w, h } = getSize();
      drawScene(ctx, w, h, sparkles, (ts - t0) / 1000);
      raf = requestAnimationFrame(frame);
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const { w, h } = getSize();
      drawScene(ctx, w, h, sparkles, 0);
    } else {
      raf = requestAnimationFrame(frame);
    }

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return (
    <div aria-hidden className={cn('pointer-events-none overflow-hidden', className)}>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
}
