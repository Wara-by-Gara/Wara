'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/cn';

type Point = [number, number];
interface BoltData { points: Point[]; branches: Point[][] }
interface RainDrop { x: number; y: number; len: number; spd: number; alpha: number }

/* ── 경로 생성 ─────────────────────────────────── */
function subdivide(
  x1: number, y1: number, x2: number, y2: number,
  depth: number, roughness: number,
): Point[] {
  if (depth === 0) return [[x1, y1], [x2, y2]];
  const midX = (x1 + x2) / 2 + (Math.random() - 0.5) * roughness;
  const midY = (y1 + y2) / 2;
  const L = subdivide(x1, y1, midX, midY, depth - 1, roughness * 0.65);
  const R = subdivide(midX, midY, x2, y2, depth - 1, roughness * 0.65);
  return [...L.slice(0, -1), ...R];
}

function createBolt(startX: number, w: number, h: number): BoltData {
  const roughness = w * 0.13;
  // 볼트 시작을 구름 안(15~25%)에서 시작하면 더 자연스러움
  const startY = h * (0.08 + Math.random() * 0.12);
  const endX   = startX + (Math.random() - 0.5) * w * 0.28;
  const endY   = h * (0.55 + Math.random() * 0.38);
  const points = subdivide(startX, startY, endX, endY, 8, roughness);

  const branches: Point[][] = [];
  const numBranches = 2 + Math.floor(Math.random() * 3);
  for (let b = 0; b < numBranches; b++) {
    const idx = Math.floor(points.length * (0.2 + Math.random() * 0.55));
    const pt  = points[idx];
    if (!pt) continue;
    const bEndX = pt[0] + (Math.random() - 0.3) * w * 0.20;
    const bEndY = pt[1] + h * (0.07 + Math.random() * 0.18);
    branches.push(subdivide(pt[0], pt[1], bEndX, bEndY, 6, roughness * 0.50));
  }
  return { points, branches };
}

/* ── 알파 커브: 리스트라이크 포함 ──────────────── */
function getBoltState(age: number): { bolt: number; sky: number; done: boolean } {
  //  0 ~ 85ms : 메인 플래시 상승
  // 85 ~250ms : 1차 페이드 → 0.15
  //250 ~330ms : 리스트라이크 상승 → 0.75
  //330 ~780ms : 최종 페이드 → 0
  if (age < 85) {
    const p = age / 85;
    return { bolt: p, sky: p * 0.22, done: false };
  }
  if (age < 250) {
    const p = (age - 85) / 165;
    return { bolt: 1 - p * 0.85, sky: (1 - p) * 0.22, done: false };
  }
  if (age < 330) {
    const p = (age - 250) / 80;
    return { bolt: 0.15 + p * 0.60, sky: p * 0.14, done: false };
  }
  if (age < 780) {
    const p = (age - 330) / 450;
    return { bolt: 0.75 * (1 - p), sky: 0.14 * (1 - p), done: false };
  }
  return { bolt: 0, sky: 0, done: true };
}

/* ── 4패스 글로우 렌더 ─────────────────────────── */
function strokePath(
  ctx: CanvasRenderingContext2D,
  pts: Point[],
  lw: number, blur: number,
  shadowCol: string, strokeCol: string, alpha: number,
) {
  if (pts.length < 2 || alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha  = alpha;
  ctx.shadowBlur   = blur;
  ctx.shadowColor  = shadowCol;
  ctx.strokeStyle  = strokeCol;
  ctx.lineWidth    = lw;
  ctx.lineCap      = 'round';
  ctx.lineJoin     = 'round';
  ctx.beginPath();
  pts.forEach((pt, i) => {
    if (i === 0) ctx.moveTo(pt[0], pt[1]);
    else ctx.lineTo(pt[0], pt[1]);
  });
  ctx.stroke();
  ctx.restore();
}

function drawBolt(ctx: CanvasRenderingContext2D, bolt: BoltData, alpha: number, scale: number) {
  const s = scale;
  // Pass 1 — 넓은 외부 코로나 (보라빛)
  strokePath(ctx, bolt.points, 16*s, 55*s, '#3045b0', '#2035a0', alpha * 0.07);
  // Pass 2 — 헤일로 (파랑)
  strokePath(ctx, bolt.points,  8*s, 25*s, '#7aa0ff', '#8ab0ff', alpha * 0.28);
  // Pass 3 — 밝은 내부 선
  strokePath(ctx, bolt.points,  4*s,  8*s, '#c8e0ff', '#e0f0ff', alpha * 0.60);
  // Pass 4 — 흰 코어
  strokePath(ctx, bolt.points, 1.8*s, 4*s, '#ffffff', '#ffffff', alpha);

  // 브랜치 (2패스)
  for (const branch of bolt.branches) {
    strokePath(ctx, branch, 5*s, 18*s, '#7aa0ff', '#8ab0ff', alpha * 0.18);
    strokePath(ctx, branch, 1.2*s, 3*s, '#e0f0ff', '#ffffff', alpha * 0.55);
  }
}

/* ── 배경 ───────────────────────────────────────── */
function drawBackground(ctx: CanvasRenderingContext2D, w: number, h: number, skyAlpha = 0) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0,   '#191c38');
  g.addColorStop(0.4, '#23294e');
  g.addColorStop(0.7, '#1d2242');
  g.addColorStop(1,   '#131628');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  if (skyAlpha > 0) {
    // 번개 플래시 — 화면 전체 파란 광채
    const fg = ctx.createRadialGradient(w / 2, 0, 0, w / 2, 0, h);
    fg.addColorStop(0,   `rgba(160,190,255,${skyAlpha * 0.55})`);
    fg.addColorStop(0.6, `rgba(100,140,255,${skyAlpha * 0.18})`);
    fg.addColorStop(1,   `rgba(60, 90,200,${skyAlpha * 0.05})`);
    ctx.fillStyle = fg;
    ctx.fillRect(0, 0, w, h);
  }
}

/* ── 비 ─────────────────────────────────────────── */
function updateAndDrawRain(
  ctx: CanvasRenderingContext2D, drops: RainDrop[], w: number, h: number, dt: number,
) {
  ctx.save();
  ctx.lineWidth = 0.9;
  for (const d of drops) {
    d.y += d.spd * dt;
    if (d.y > 1 + d.len) { d.y = -d.len; d.x = Math.random(); }
    const x1 = d.x * w + d.y * h * 0.14;
    const y1 = d.y * h;
    ctx.strokeStyle = `rgba(180,210,255,${d.alpha})`;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x1 + d.len * h * 0.14, y1 + d.len * h);
    ctx.stroke();
  }
  ctx.restore();
}

/* ── 컴포넌트 ───────────────────────────────────── */
export function LightningScene({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

    let raf = 0;
    let t0: number | null = null;
    let prevTs = 0;
    let activeBolt: { bolt: BoltData; startTime: number } | null = null;
    let nextStrike = 500 + Math.random() * 800;
    let lastStrikeAt = 0;

    const rainDrops: RainDrop[] = Array.from({ length: 180 }, () => ({
      x: Math.random(), y: Math.random(),
      len: 0.025 + Math.random() * 0.035,
      spd: 0.55 + Math.random() * 0.55,
      alpha: 0.15 + Math.random() * 0.30,
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
      if (!t0) { t0 = ts; prevTs = ts; }
      const elapsed = ts - t0;
      const dt = Math.min((ts - prevTs) / 1000, 0.05);
      prevTs = ts;
      const { w, h } = getSize();

      if (!activeBolt && elapsed - lastStrikeAt > nextStrike) {
        const x = w * (0.1 + Math.random() * 0.8);
        activeBolt   = { bolt: createBolt(x, w, h), startTime: elapsed };
        lastStrikeAt = elapsed;
        nextStrike   = 800 + Math.random() * 1500;
      }

      let boltAlpha = 0;
      let skyAlpha  = 0;

      if (activeBolt) {
        const state = getBoltState(elapsed - activeBolt.startTime);
        if (state.done) {
          activeBolt = null;
        } else {
          boltAlpha = state.bolt;
          skyAlpha  = state.sky;
        }
      }

      ctx.clearRect(0, 0, w, h);
      drawBackground(ctx, w, h, skyAlpha);
      updateAndDrawRain(ctx, rainDrops, w, h, dt);

      if (activeBolt && boltAlpha > 0) {
        drawBolt(ctx, activeBolt.bolt, boltAlpha, Math.max(w, 1) / 390);
      }

      raf = requestAnimationFrame(frame);
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const { w, h } = getSize();
      drawBackground(ctx, w, h);
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
