'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/cn';

/* ── 필드 ───────────────────────────────────────── */
function drawField(ctx: CanvasRenderingContext2D, w: number, h: number) {
  // 잔디 그라데이션
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#2e8020');
  g.addColorStop(1, '#1d5a12');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  // 번갈아 가는 밝은 잔디 스트라이프
  for (let i = 0; i < 9; i++) {
    if (i % 2 === 0) {
      ctx.fillStyle = 'rgba(255,255,255,0.055)';
      ctx.fillRect(0, i * h / 9, w, h / 9);
    }
  }

  // 필드 라인
  ctx.strokeStyle = 'rgba(255,255,255,0.6)';
  ctx.lineWidth = Math.max(1.5, w * 0.004);

  // 중앙선
  ctx.beginPath();
  ctx.moveTo(0, h * 0.5);
  ctx.lineTo(w, h * 0.5);
  ctx.stroke();

  // 중앙 원
  ctx.beginPath();
  ctx.arc(w * 0.5, h * 0.5, Math.min(w, h) * 0.17, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.beginPath();
  ctx.arc(w * 0.5, h * 0.5, 4, 0, Math.PI * 2);
  ctx.fill();

  // 페널티 박스
  const bw = w * 0.54, bh = h * 0.17, bx = (w - bw) / 2;
  ctx.strokeRect(bx, 0, bw, bh);
  ctx.strokeRect(bx, h - bh, bw, bh);

  // 골 에어리어
  const gw = w * 0.28, gh = h * 0.08, gx = (w - gw) / 2;
  ctx.strokeRect(gx, 0, gw, gh);
  ctx.strokeRect(gx, h - gh, gw, gh);
}

/* ── 축구공 (rotation으로 굴림) ─────────────────── */
function drawBall(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, rotation: number) {
  ctx.save();
  // 그림자 (회전 영향 없음)
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(cx, cy + r * 0.9, r * 0.7, r * 0.18, 0, 0, Math.PI * 2);
  ctx.fill();

  // 공 중심으로 이동 후 회전
  ctx.translate(cx, cy);
  ctx.rotate(rotation);

  // 공 본체
  ctx.fillStyle = '#f0f0f0';
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();

  // 검은 패치 (원점 기준)
  ctx.fillStyle = '#111';
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
    const px = Math.cos(a) * r * 0.32;
    const py = Math.sin(a) * r * 0.32;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();

  for (let j = 0; j < 5; j++) {
    const base = (j / 5) * Math.PI * 2 - Math.PI / 2;
    const pcx = Math.cos(base) * r * 0.63;
    const pcy = Math.sin(base) * r * 0.63;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + base + Math.PI;
      if (i === 0) ctx.moveTo(pcx + Math.cos(a) * r * 0.24, pcy + Math.sin(a) * r * 0.24);
      else ctx.lineTo(pcx + Math.cos(a) * r * 0.24, pcy + Math.sin(a) * r * 0.24);
    }
    ctx.closePath();
    ctx.fill();
  }

  // 아웃라인
  ctx.strokeStyle = '#333';
  ctx.lineWidth = r * 0.07;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();

  // 광택 (회전 없이 항상 좌상단 고정)
  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.beginPath();
  ctx.arc(cx - r * 0.25, cy - r * 0.25, r * 0.18, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/* ── 치비 캐릭터 ─────────────────────────────────── */
function drawCharacter(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  s: number,
  dir: 1 | -1,
  phase: number,
) {
  ctx.save();
  ctx.translate(cx, cy);
  if (dir === -1) ctx.scale(-1, 1);

  const swing = Math.sin(phase) * 0.52;

  // 그림자
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.beginPath();
  ctx.ellipse(0, 0, s * 0.28, s * 0.065, 0, 0, Math.PI * 2);
  ctx.fill();

  // ── 다리 ──
  function drawLeg(ox: number, rot: number) {
    ctx.save();
    ctx.translate(ox, -s * 0.28);
    ctx.rotate(rot);
    ctx.fillStyle = '#e0e0e0';
    ctx.beginPath();
    ctx.rect(-s * 0.09, 0, s * 0.18, s * 0.2);
    ctx.fill();
    ctx.fillStyle = '#dd1111';
    ctx.beginPath();
    ctx.rect(-s * 0.08, s * 0.19, s * 0.16, s * 0.18);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.fillRect(-s * 0.08, s * 0.21, s * 0.16, s * 0.025);
    ctx.fillRect(-s * 0.08, s * 0.25, s * 0.16, s * 0.025);
    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.ellipse(0, s * 0.38, s * 0.09, s * 0.04, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  drawLeg(-s * 0.1, swing);
  drawLeg(s * 0.1, -swing);

  // ── 반바지 ──
  ctx.fillStyle = '#d8d8d8';
  ctx.fillRect(-s * 0.22, -s * 0.3, s * 0.44, s * 0.08);

  // ── 저지 ──
  ctx.fillStyle = '#dd1111';
  ctx.beginPath();
  ctx.rect(-s * 0.22, -s * 0.55, s * 0.44, s * 0.28);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(-s * 0.22, -s * 0.55, s * 0.07, s * 0.1);
  ctx.fillRect(s * 0.15, -s * 0.55, s * 0.07, s * 0.1);
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${s * 0.14}px Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('7', 0, -s * 0.41);

  // ── 팔 (상완 + 전완 팔꿈치 꺾임) ──
  function drawArm(ox: number, upperRot: number) {
    ctx.save();
    ctx.translate(ox, -s * 0.5);
    ctx.rotate(upperRot);
    ctx.fillStyle = '#dd1111';
    ctx.beginPath();
    ctx.rect(-s * 0.055, 0, s * 0.11, s * 0.15);
    ctx.fill();
    ctx.save();
    ctx.translate(0, s * 0.15);
    ctx.rotate(-Math.PI * 0.55 - upperRot * 0.35);
    ctx.fillStyle = '#ffd4b4';
    ctx.beginPath();
    ctx.rect(-s * 0.048, 0, s * 0.096, s * 0.13);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, s * 0.14, s * 0.063, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.restore();
  }
  drawArm(-s * 0.25, swing * 0.85);
  drawArm(s * 0.25, -swing * 0.85);

  // ── 목 ──
  ctx.fillStyle = '#ffd4b4';
  ctx.fillRect(-s * 0.09, -s * 0.62, s * 0.18, s * 0.09);

  // ── 머리 ──
  ctx.fillStyle = '#ffd4b4';
  ctx.beginPath();
  ctx.arc(0, -s * 0.88, s * 0.33, 0, Math.PI * 2);
  ctx.fill();

  // ── 스포츠컷 머리카락 ──
  ctx.fillStyle = '#2e1a0a';
  ctx.beginPath();
  ctx.arc(0, -s * 0.88, s * 0.335, 0, Math.PI, true);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.arc(-s * 0.305, -s * 0.88, s * 0.07, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(s * 0.305, -s * 0.88, s * 0.07, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(-s * 0.1, -s * 1.18, s * 0.15, s * 0.1, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(s * 0.07, -s * 1.2, s * 0.13, s * 0.09, 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(0, -s * 1.12, s * 0.16, s * 0.07, 0, 0, Math.PI * 2);
  ctx.fill();

  // ── 눈 ──
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.ellipse(-s * 0.13, -s * 0.88, s * 0.09, s * 0.11, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(s * 0.13, -s * 0.88, s * 0.09, s * 0.11, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1a0a00';
  ctx.beginPath();
  ctx.ellipse(-s * 0.12, -s * 0.87, s * 0.063, s * 0.085, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(s * 0.14, -s * 0.87, s * 0.063, s * 0.085, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(-s * 0.09, -s * 0.91, s * 0.026, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(s * 0.17, -s * 0.91, s * 0.026, 0, Math.PI * 2);
  ctx.fill();

  // ── 볼터치 ──
  ctx.fillStyle = 'rgba(255,110,110,0.32)';
  ctx.beginPath();
  ctx.ellipse(-s * 0.22, -s * 0.81, s * 0.09, s * 0.055, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(s * 0.22, -s * 0.81, s * 0.09, s * 0.055, 0, 0, Math.PI * 2);
  ctx.fill();

  // ── 입 ──
  ctx.strokeStyle = '#b06050';
  ctx.lineWidth = s * 0.022;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(0, -s * 0.77, s * 0.08, 0.12 * Math.PI, 0.88 * Math.PI);
  ctx.stroke();

  ctx.restore();
}

/* ── 컴포넌트 ───────────────────────────────────── */
export function SoccerScene({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

    let raf = 0;
    let t0: number | null = null;
    let prevTs = 0;

    const char = { x: 0.3, y: 0.75, dir: 1 as 1 | -1, phase: 0 };
    let ballRotation = 0;

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
      const dt = Math.min((ts - prevTs) / 1000, 0.05);
      prevTs = ts;
      const { w, h } = getSize();

      // 캐릭터 이동
      char.x += char.dir * 0.055 * dt;
      char.phase += dt * 7.5;
      if (char.x > 0.86) char.dir = -1;
      if (char.x < 0.14) char.dir = 1;

      // 점프 바운스
      const bounce = -Math.abs(Math.sin(char.phase)) * 0.018;
      const cy = (char.y + bounce) * h;

      const charSize = Math.min(w, h) * 0.19;
      const ballR = charSize * 0.21;

      // 공 위치 & 회전 (이동거리 / 반지름 = 회전각)
      const ballX = (char.x + char.dir * 0.1) * w;
      const ballY = char.y * h;
      ballRotation += (char.dir * 0.055 * dt * w) / ballR;

      ctx.clearRect(0, 0, w, h);
      drawField(ctx, w, h);
      drawBall(ctx, ballX, ballY, ballR, ballRotation);
      drawCharacter(ctx, char.x * w, cy, charSize, char.dir, char.phase);

      raf = requestAnimationFrame(frame);
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const { w, h } = getSize();
      ctx.clearRect(0, 0, w, h);
      drawField(ctx, w, h);
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
