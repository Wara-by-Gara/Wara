'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/cn';

const PALETTES = [
  ['#ffd700', '#ffec6e', '#ffffff'],
  ['#ff69b4', '#ff1493', '#ffffff'],
  ['#da70d6', '#9b59b6', '#ffffff'],
  ['#adff2f', '#ffd700', '#ffffff'],
  ['#ff69b4', '#ffd700', '#adff2f'],
];

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  color: string;
  radius: number;
  trail: Array<{ x: number; y: number }>;
}

interface Ray {
  angle: number;
  length: number;
  maxLength: number;
  alpha: number;
  color: string;
  width: number;
}

interface Bokeh {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  color: string;
}

type Phase = 'launch' | 'burst' | 'done';

interface Firework {
  x: number;
  y: number;
  targetY: number;
  vy: number;
  trail: Array<{ x: number; y: number }>;
  phase: Phase;
  palette: string[];
  rays: Ray[];
  sparks: Spark[];
  bokehs: Bokeh[];
  burstAlpha: number;
  age: number;
  scale: number; // 폭죽마다 다른 크기 (0.5 ~ 1.8)
}

function randomPalette(): string[] {
  return PALETTES[Math.floor(Math.random() * PALETTES.length)]!;
}

function pickColor(palette: string[]): string {
  return palette[Math.floor(Math.random() * palette.length)]!;
}

function createFirework(W: number, H: number): Firework {
  return {
    x: W * (0.15 + Math.random() * 0.7),
    y: H + 10,
    targetY: H * (0.15 + Math.random() * 0.45),
    vy: -(550 + Math.random() * 200),
    trail: [],
    phase: 'launch',
    palette: randomPalette(),
    rays: [],
    sparks: [],
    bokehs: [],
    burstAlpha: 1,
    age: 0,
    scale: 0.5 + Math.random() * 1.3,
  };
}

function burst(fw: Firework): void {
  fw.phase = 'burst';
  fw.age = 0;

  const rayCount = 8 + Math.floor(Math.random() * 7);
  for (let i = 0; i < rayCount; i++) {
    fw.rays.push({
      angle: (Math.PI * 2 * i) / rayCount + (Math.random() - 0.5) * 0.4,
      length: 0,
      maxLength: (40 + Math.random() * 90) * fw.scale,
      alpha: 1,
      color: pickColor(fw.palette),
      width: (0.8 + Math.random() * 1.4) * fw.scale,
    });
  }

  const sparkCount = 22 + Math.floor(Math.random() * 14);
  for (let i = 0; i < sparkCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = (80 + Math.random() * 180) * fw.scale;
    fw.sparks.push({
      x: fw.x,
      y: fw.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      alpha: 1,
      color: pickColor(fw.palette),
      radius: 1.5 + Math.random() * 2,
      trail: [],
    });
  }

  const bokehCount = 2 + Math.floor(Math.random() * 3);
  for (let i = 0; i < bokehCount; i++) {
    fw.bokehs.push({
      x: fw.x + (Math.random() - 0.5) * 120,
      y: fw.y + (Math.random() - 0.5) * 80,
      radius: 10,
      maxRadius: 40 + Math.random() * 60,
      alpha: 0.18 + Math.random() * 0.15,
      color: pickColor(fw.palette),
    });
  }
}

export function FireworkAnimation({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let destroyed = false;
    let frameId: number;
    let lastTime = performance.now();

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

    // 5개 폭죽, 랜덤 시간차로 시작
    const fireworks: Firework[] = Array.from({ length: 5 }, (_, i) => {
      const fw = createFirework(W0, H0);
      fw.age = -(i * (0.7 + Math.random() * 0.8));
      return fw;
    });

    function drawGlow(
      x: number, y: number, radius: number, color: string, alpha: number,
    ) {
      const grad = ctx!.createRadialGradient(x, y, 0, x, y, radius);
      grad.addColorStop(0, color.replace(')', `, ${alpha})`).replace('rgb(', 'rgba(').replace('#', 'rgba(').replace(/rgba\(([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2}),/, (_, r, g, b) =>
        `rgba(${parseInt(r, 16)},${parseInt(g, 16)},${parseInt(b, 16)},`));
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx!.fillStyle = grad;
      ctx!.beginPath();
      ctx!.arc(x, y, radius, 0, Math.PI * 2);
      ctx!.fill();
    }

    function hexToRgba(hex: string, alpha: number): string {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r},${g},${b},${alpha})`;
    }

    function animate(now: number) {
      if (destroyed) return;
      frameId = requestAnimationFrame(animate);

      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      const W = canvas!.offsetWidth;
      const H = canvas!.offsetHeight;

      ctx!.clearRect(0, 0, W, H);

      for (const fw of fireworks) {
        fw.age += dt;

        if (fw.age < 0) continue; // stagger delay

        if (fw.phase === 'launch') {
          fw.y += fw.vy * dt;
          fw.trail.push({ x: fw.x, y: fw.y });
          if (fw.trail.length > 12) fw.trail.shift();

          // trail 그리기
          for (let i = 0; i < fw.trail.length - 1; i++) {
            const t = fw.trail[i]!;
            const alpha = (i / fw.trail.length) * 0.6;
            ctx!.strokeStyle = hexToRgba('#ffffff', alpha);
            ctx!.lineWidth = 1.5;
            ctx!.beginPath();
            ctx!.moveTo(t.x, t.y);
            ctx!.lineTo(fw.trail[i + 1]!.x, fw.trail[i + 1]!.y);
            ctx!.stroke();
          }

          // 발사체 밝은 점
          ctx!.shadowBlur = 12;
          ctx!.shadowColor = '#ffffff';
          ctx!.fillStyle = '#ffffff';
          ctx!.beginPath();
          ctx!.arc(fw.x, fw.y, 2.5, 0, Math.PI * 2);
          ctx!.fill();
          ctx!.shadowBlur = 0;

          if (fw.y <= fw.targetY) burst(fw);

        } else if (fw.phase === 'burst') {
          const burstAge = fw.age;

          // Bokeh
          for (const bk of fw.bokehs) {
            const t = Math.min(burstAge / 0.6, 1);
            bk.radius = bk.maxRadius * t;
            const alpha = bk.alpha * (1 - burstAge / 1.4);
            if (alpha <= 0) continue;
            const grad = ctx!.createRadialGradient(bk.x, bk.y, 0, bk.x, bk.y, bk.radius);
            grad.addColorStop(0, hexToRgba(bk.color, alpha));
            grad.addColorStop(0.5, hexToRgba(bk.color, alpha * 0.4));
            grad.addColorStop(1, hexToRgba(bk.color, 0));
            ctx!.fillStyle = grad;
            ctx!.beginPath();
            ctx!.arc(bk.x, bk.y, bk.radius, 0, Math.PI * 2);
            ctx!.fill();
          }

          // 중심 발광 — 넓은 외곽 glow + 핵심 밝은 점
          const centerAlpha = Math.max(0, 1 - burstAge / 0.5);
          if (centerAlpha > 0) {
            const glowR = 80 * fw.scale;
            const coreR = 24 * fw.scale;
            // 넓은 외곽 glow
            ctx!.shadowBlur = 0;
            const outerGlow = ctx!.createRadialGradient(fw.x, fw.y, 0, fw.x, fw.y, glowR);
            outerGlow.addColorStop(0, hexToRgba(fw.palette[0]!, centerAlpha * 0.55));
            outerGlow.addColorStop(0.5, hexToRgba(fw.palette[0]!, centerAlpha * 0.18));
            outerGlow.addColorStop(1, hexToRgba(fw.palette[0]!, 0));
            ctx!.fillStyle = outerGlow;
            ctx!.beginPath();
            ctx!.arc(fw.x, fw.y, glowR, 0, Math.PI * 2);
            ctx!.fill();
            // 중심 핵
            ctx!.shadowBlur = 40;
            ctx!.shadowColor = fw.palette[0]!;
            const cg = ctx!.createRadialGradient(fw.x, fw.y, 0, fw.x, fw.y, coreR);
            cg.addColorStop(0, hexToRgba('#ffffff', centerAlpha));
            cg.addColorStop(0.35, hexToRgba(fw.palette[0]!, centerAlpha * 0.7));
            cg.addColorStop(1, hexToRgba(fw.palette[0]!, 0));
            ctx!.fillStyle = cg;
            ctx!.beginPath();
            ctx!.arc(fw.x, fw.y, coreR, 0, Math.PI * 2);
            ctx!.fill();
            ctx!.shadowBlur = 0;
          }

          // Rays
          const rayGrowSpeed = 180;
          let allRaysDone = true;
          for (const ray of fw.rays) {
            ray.length = Math.min(ray.maxLength, ray.length + rayGrowSpeed * dt);
            ray.alpha = Math.max(0, 1 - burstAge / 0.9);
            if (ray.alpha > 0) allRaysDone = false;

            const ex = fw.x + Math.cos(ray.angle) * ray.length;
            const ey = fw.y + Math.sin(ray.angle) * ray.length;

            ctx!.save();
            ctx!.shadowColor = ray.color;
            // 레이어 1: 넓은 glow (두꺼운 선 + 강한 shadowBlur)
            ctx!.globalAlpha = ray.alpha * 0.45;
            ctx!.shadowBlur = 50;
            ctx!.strokeStyle = ray.color;
            ctx!.lineWidth = ray.width * 4;
            ctx!.beginPath();
            ctx!.moveTo(fw.x, fw.y);
            ctx!.lineTo(ex, ey);
            ctx!.stroke();
            // 레이어 2: 선명한 중심선
            ctx!.globalAlpha = ray.alpha;
            ctx!.shadowBlur = 12;
            ctx!.lineWidth = ray.width * 0.7;
            ctx!.strokeStyle = '#ffffff';
            ctx!.beginPath();
            ctx!.moveTo(fw.x, fw.y);
            ctx!.lineTo(ex, ey);
            ctx!.stroke();
            // 끝점 반짝임
            ctx!.shadowBlur = 20;
            ctx!.fillStyle = '#ffffff';
            ctx!.beginPath();
            ctx!.arc(ex, ey, ray.width * 2.5, 0, Math.PI * 2);
            ctx!.fill();
            ctx!.restore();
          }

          // Sparks
          let allSparksDone = true;
          for (const sp of fw.sparks) {
            sp.vy += 340 * dt; // gravity
            sp.vx *= 0.97;
            sp.x += sp.vx * dt;
            sp.y += sp.vy * dt;
            sp.alpha = Math.max(0, sp.alpha - dt * 0.7);
            sp.trail.push({ x: sp.x, y: sp.y });
            if (sp.trail.length > 6) sp.trail.shift();

            if (sp.alpha > 0) allSparksDone = false;

            // spark trail
            for (let i = 0; i < sp.trail.length - 1; i++) {
              const ta = (i / sp.trail.length) * sp.alpha * 0.5;
              ctx!.strokeStyle = hexToRgba(sp.color, ta);
              ctx!.lineWidth = sp.radius * 0.6;
              ctx!.beginPath();
              ctx!.moveTo(sp.trail[i]!.x, sp.trail[i]!.y);
              ctx!.lineTo(sp.trail[i + 1]!.x, sp.trail[i + 1]!.y);
              ctx!.stroke();
            }

            ctx!.save();
            ctx!.globalAlpha = sp.alpha;
            ctx!.shadowBlur = 6;
            ctx!.shadowColor = sp.color;
            ctx!.fillStyle = sp.color;
            ctx!.beginPath();
            ctx!.arc(sp.x, sp.y, sp.radius, 0, Math.PI * 2);
            ctx!.fill();
            ctx!.restore();
          }

          if (allRaysDone && allSparksDone) {
            // 새 폭죽으로 재시작
            Object.assign(fw, createFirework(W, H));
            fw.age = -(Math.random() * 0.5); // 약간 delay
          }
        }
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
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={cn('absolute inset-0 w-full h-full pointer-events-none', className)}
    />
  );
}
