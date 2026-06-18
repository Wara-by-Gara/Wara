'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/cn';

interface CloudDef { x: number; y: number; w: number; h: number; spd: number; glow: number }
interface StarDef  { x: number; y: number; r: number; ph: number; spd: number; a: number }

const CLOUDS: CloudDef[] = [
  { x: 0.04, y: 0.26, w: 0.22, h: 0.07, spd: 0.005, glow: 0.65 },
  { x: 0.32, y: 0.20, w: 0.30, h: 0.09, spd: 0.004, glow: 0.50 },
  { x: 0.68, y: 0.28, w: 0.20, h: 0.07, spd: 0.006, glow: 0.60 },
  { x: 0.78, y: 0.15, w: 0.16, h: 0.05, spd: 0.003, glow: 0.40 },
  { x: 0.10, y: 0.42, w: 0.32, h: 0.09, spd: 0.008, glow: 1.00 },
  { x: 0.52, y: 0.45, w: 0.26, h: 0.08, spd: 0.007, glow: 0.95 },
  { x: 0.82, y: 0.40, w: 0.18, h: 0.06, spd: 0.009, glow: 0.90 },
];

/* 구름 모양: 여러 원 합집합 */
function fillCloud(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, cw: number, ch: number,
) {
  const r = ch * 0.55;
  const bumps: [number, number, number][] = [
    [cx,            cy,            r],
    [cx + cw * 0.20, cy - ch * 0.22, r * 0.80],
    [cx + cw * 0.45, cy - ch * 0.10, r * 0.90],
    [cx + cw * 0.68, cy - ch * 0.20, r * 0.75],
    [cx + cw,        cy,              r * 0.60],
  ];
  ctx.beginPath();
  for (const [bx, by, br] of bumps) {
    ctx.moveTo(bx + br, by);
    ctx.arc(bx, by, br, 0, Math.PI * 2);
  }
  ctx.fill();
}

/* 메인 렌더 */
function drawSunset(
  ctx: CanvasRenderingContext2D,
  w: number, h: number,
  t: number,
  clouds: CloudDef[],
  stars: StarDef[],
) {
  // ── 하늘 그라데이션 (위→아래) ──
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0,    '#09041a');
  sky.addColorStop(0.12, '#12083a');
  sky.addColorStop(0.24, '#2a0a5c');
  sky.addColorStop(0.36, '#58103e');
  sky.addColorStop(0.48, '#8e1c28');
  sky.addColorStop(0.60, '#c43010');
  sky.addColorStop(0.70, '#e05808');
  sky.addColorStop(0.80, '#f08818');
  sky.addColorStop(0.88, '#f5b02a');
  sky.addColorStop(0.94, '#f8cc58');
  sky.addColorStop(1,    '#fce880');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  // ── 별 (상단 22%) ──
  ctx.save();
  for (const s of stars) {
    const alpha = ((Math.sin(s.ph + t * s.spd) + 1) / 2) * s.a;
    ctx.fillStyle = `rgba(255,255,240,${alpha.toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(s.x * w, s.y * h, s.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // ── 태양 위치 ──
  const sunX = w * 0.50;
  const sunY = h * 0.91;
  const sunR = Math.min(w, h) * 0.054;

  // ── 대형 방사 글로우 ──
  const bigGlow = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunR * 9);
  bigGlow.addColorStop(0,    'rgba(255,220,120,0.75)');
  bigGlow.addColorStop(0.07, 'rgba(255,150,30,0.55)');
  bigGlow.addColorStop(0.20, 'rgba(230,70,5,0.28)');
  bigGlow.addColorStop(0.45, 'rgba(160,20,0,0.10)');
  bigGlow.addColorStop(0.80, 'rgba(80,5,20,0.03)');
  bigGlow.addColorStop(1,    'rgba(40,0,10,0)');
  ctx.fillStyle = bigGlow;
  ctx.fillRect(0, 0, w, h);

  // ── 빛 기둥 (god rays) ──
  ctx.save();
  const RAY_N = 11;
  for (let i = 0; i < RAY_N; i++) {
    const norm   = (i - RAY_N / 2) / RAY_N; // -0.5 ~ 0.5
    const base   = -Math.PI / 2 + norm * Math.PI * 0.65;
    const anim   = Math.sin(t * 0.18 + i * 0.95) * 0.022;
    const spread = 0.028 + Math.sin(t * 0.22 + i * 1.8) * 0.007;
    const alpha  = (0.025 - Math.abs(norm) * 0.04) + Math.sin(t * 0.28 + i) * 0.008;
    if (alpha <= 0) continue;
    const len = Math.max(w, h) * 1.7;
    ctx.globalAlpha = Math.max(0, alpha);
    ctx.fillStyle = '#ffcc44';
    ctx.beginPath();
    ctx.moveTo(sunX, sunY);
    ctx.lineTo(sunX + Math.cos(base - spread + anim) * len, sunY + Math.sin(base - spread + anim) * len);
    ctx.lineTo(sunX + Math.cos(base + spread + anim) * len, sunY + Math.sin(base + spread + anim) * len);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // ── 구름 ──
  ctx.save();
  for (const cloud of clouds) {
    const cx = ((cloud.x + t * cloud.spd) % 1.35 - 0.18) * w;
    const cy = cloud.y * h;
    const cw = cloud.w * w;
    const ch = cloud.h * h;

    // 하단 노을 글로우
    if (cloud.glow > 0.45) {
      ctx.globalAlpha = 0.55 * cloud.glow;
      ctx.fillStyle = `rgba(255,110,15,1)`;
      fillCloud(ctx, cx, cy + ch * 0.28, cw * 1.06, ch * 1.15);
    }
    // 실루엣 (어두운 보라-검정)
    ctx.globalAlpha = 0.88;
    ctx.fillStyle = '#14062a';
    fillCloud(ctx, cx, cy, cw, ch);
  }
  ctx.restore();

  // ── 태양 디스크 ──
  const disc = ctx.createRadialGradient(sunX, sunY * 0.99, 0, sunX, sunY, sunR);
  disc.addColorStop(0,    '#fffde8');
  disc.addColorStop(0.30, '#fff0a0');
  disc.addColorStop(0.65, '#ffcc38');
  disc.addColorStop(1,    '#ff9010');
  ctx.fillStyle = disc;
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
  ctx.fill();

  // 코어
  ctx.fillStyle = 'rgba(255,255,248,0.96)';
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunR * 0.40, 0, Math.PI * 2);
  ctx.fill();

  // ── 수평선 글로우 밴드 ──
  const hglow = ctx.createLinearGradient(0, h * 0.74, 0, h);
  hglow.addColorStop(0,   'rgba(255,120,0,0)');
  hglow.addColorStop(0.5, 'rgba(255,165,25,0.13)');
  hglow.addColorStop(1,   'rgba(255,210,70,0.28)');
  ctx.fillStyle = hglow;
  ctx.fillRect(0, h * 0.74, w, h * 0.26);

  // ── 지평선 언덕 실루엣 ──
  ctx.fillStyle = '#050212';
  ctx.beginPath();
  ctx.moveTo(0, h);
  ctx.lineTo(0, h * 0.915);
  ctx.bezierCurveTo(w * 0.08, h * 0.875, w * 0.18, h * 0.925, w * 0.30, h * 0.895);
  ctx.bezierCurveTo(w * 0.42, h * 0.862, w * 0.50, h * 0.930, w * 0.60, h * 0.900);
  ctx.bezierCurveTo(w * 0.70, h * 0.870, w * 0.82, h * 0.920, w * 0.91, h * 0.890);
  ctx.bezierCurveTo(w * 0.96, h * 0.872, w, h * 0.910, w, h * 0.910);
  ctx.lineTo(w, h);
  ctx.closePath();
  ctx.fill();
}

/* ── 컴포넌트 ── */
export function SunsetScene({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
    let raf = 0;
    let t0: number | null = null;

    const stars: StarDef[] = Array.from({ length: 60 }, () => ({
      x: Math.random(),
      y: Math.random() * 0.23,
      r: 0.5 + Math.random() * 1.3,
      ph: Math.random() * Math.PI * 2,
      spd: 0.7 + Math.random() * 1.6,
      a: 0.15 + Math.random() * 0.65,
    }));

    function getSize() {
      const el = canvasRef.current;
      return {
        w: el ? (el.clientWidth  || el.offsetWidth  || window.innerWidth)  : window.innerWidth,
        h: el ? (el.clientHeight || el.offsetHeight || window.innerHeight) : window.innerHeight,
      };
    }

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

    function frame(ts: number) {
      if (!t0) t0 = ts;
      const t = (ts - t0) / 1000;
      const { w, h } = getSize();
      ctx.clearRect(0, 0, w, h);
      drawSunset(ctx, w, h, t, CLOUDS, stars);
      raf = requestAnimationFrame(frame);
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const { w, h } = getSize();
      drawSunset(ctx, w, h, 0, CLOUDS, stars);
    } else {
      raf = requestAnimationFrame(frame);
    }

    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, []);

  return (
    <div aria-hidden className={cn('pointer-events-none overflow-hidden', className)}>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
}
