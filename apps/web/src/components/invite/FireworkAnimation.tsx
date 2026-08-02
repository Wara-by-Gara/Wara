'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/cn';

// "라이트 스카이" 팔레트 — 맑은 하늘처럼 깨끗한 파스텔 톤
const PALETTES = [
  ['#B3E5FC', '#E1F5FE', '#ffffff'],
  ['#F8BBD0', '#FFF59D', '#ffffff'],
  ['#C8E6C9', '#E1F5FE', '#ffffff'],
  ['#FFF59D', '#B3E5FC', '#ffffff'],
  ['#F8BBD0', '#C8E6C9', '#B3E5FC'],
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
  growDuration: number;
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
  scale: number; // 폭죽마다 다른 크기 (0.65 ~ 2.05)
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
    scale: 0.65 + Math.random() * 1.4,
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
      maxLength: (55 + Math.random() * 60) * fw.scale,
      growDuration: 0.32 + Math.random() * 0.18,
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

          // Rays — 터지는 순간 빠르게 뻗다가 공기저항으로 느려지는 ease-out
          let allRaysDone = true;
          for (const ray of fw.rays) {
            const growT = Math.min(burstAge / ray.growDuration, 1);
            const eased = 1 - Math.pow(1 - growT, 3);
            ray.length = ray.maxLength * eased;
            ray.alpha = Math.max(0, 1 - burstAge / 0.9);
            if (ray.alpha > 0) allRaysDone = false;

            const ex = fw.x + Math.cos(ray.angle) * ray.length;
            const ey = fw.y + Math.sin(ray.angle) * ray.length;

            ctx!.save();
            ctx!.shadowColor = ray.color;
            // 하나의 선에 하나의 그라데이션 — 뿌리는 투명, 중간은 색, 끝은 흰색으로 자연스럽게 이어짐
            ctx!.globalAlpha = ray.alpha;
            ctx!.shadowBlur = 28;
            const rayGrad = ctx!.createLinearGradient(fw.x, fw.y, ex, ey);
            rayGrad.addColorStop(0, hexToRgba(ray.color, 0));
            rayGrad.addColorStop(0.55, ray.color);
            rayGrad.addColorStop(1, '#ffffff');
            ctx!.strokeStyle = rayGrad;
            ctx!.lineWidth = ray.width * 1.1;
            ctx!.beginPath();
            ctx!.moveTo(fw.x, fw.y);
            ctx!.lineTo(ex, ey);
            ctx!.stroke();
            // 끝점 반짝임 — 뻗어나가는 동안은 또렷하게, 다 뻗은 뒤 짧게 페이드아웃
            const tipR = ray.width * 3.5;
            const tipFadeDuration = 0.35;
            const tipAlpha =
              burstAge < ray.growDuration
                ? 1
                : Math.max(0, 1 - (burstAge - ray.growDuration) / tipFadeDuration);
            ctx!.globalAlpha = tipAlpha;
            ctx!.shadowBlur = 32;
            ctx!.shadowColor = '#ffffff';
            const tipGrad = ctx!.createRadialGradient(ex, ey, 0, ex, ey, tipR);
            tipGrad.addColorStop(0, '#ffffff');
            tipGrad.addColorStop(0.15, '#ffffff');
            tipGrad.addColorStop(0.5, hexToRgba(ray.color, 0.35));
            tipGrad.addColorStop(1, hexToRgba(ray.color, 0));
            ctx!.fillStyle = tipGrad;
            ctx!.beginPath();
            ctx!.arc(ex, ey, tipR, 0, Math.PI * 2);
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
