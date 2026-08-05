'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/cn';

const PAW_SRC = '/paw-print.png';
const COUNT = 12;
const SPEED = 1.4;

/** 결정론적 의사난수 [0, 1) — (cycleN, salt)에 안정적인 값. sin-hash 방식. */
function pseudoRand(cycleN: number, salt: number): number {
  const x = Math.sin(cycleN * 78.233 + salt * 37.719) * 43758.5453;
  return x - Math.floor(x);
}

interface Props {
  className?: string;
}

export function PawprintTrailAnimation({ className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    let imgLoaded = false;
    img.onload = () => {
      imgLoaded = true;
    };
    img.src = PAW_SRC;

    function resize() {
      const dpr = Math.min(window.devicePixelRatio, 2);
      const W = canvas!.offsetWidth;
      const H = canvas!.offsetHeight;
      canvas!.width = W * dpr;
      canvas!.height = H * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    let destroyed = false;
    let frameId: number;
    const startTime = performance.now();

    function animate(now: number) {
      if (destroyed) return;
      frameId = requestAnimationFrame(animate);

      const W = canvas!.offsetWidth;
      const H = canvas!.offsetHeight;
      ctx!.clearRect(0, 0, W, H);
      if (!imgLoaded) return;

      const pawH = Math.min(W, H) * 0.07;
      const pawW = pawH * (2.2 / 2.8);
      const pawOffset = pawH * 0.32;
      const halfW = W * 0.55;
      const halfH = H * 0.45;
      const cx = W / 2;
      const cy = H / 2;

      const t = (now - startTime) / 1000;
      const cycleDuration = 9 / SPEED;
      const phase = t / cycleDuration;
      const cycleN = Math.floor(phase);
      const walkerT = phase - cycleN;

      const fromRight = pseudoRand(cycleN, 9) > 0.5;
      const yStart = cy + (pseudoRand(cycleN, 1) * 2 - 1) * halfH;
      const yEnd = cy + (pseudoRand(cycleN, 2) * 2 - 1) * halfH;
      const xStart = fromRight ? cx + halfW : cx - halfW;
      const xEnd = fromRight ? cx - halfW : cx + halfW;
      const dirX = xEnd - xStart;
      const dirY = yEnd - yStart;
      const dirLen = Math.hypot(dirX, dirY) || 1;
      const nx = -dirY / dirLen;
      const ny = dirX / dirLen;
      const angle = Math.atan2(dirY, dirX);

      const trailWindow = (1 / COUNT) * 3.2;

      for (let i = 0; i < COUNT; i++) {
        const stepT = i / COUNT;
        const localT = walkerT - stepT;
        if (localT < 0 || localT >= trailWindow) continue;

        const p = localT / trailWindow;
        let opacity = 0;
        if (p < 0.15) opacity = (p / 0.15) * 0.85;
        else if (p < 0.6) opacity = 0.85;
        else opacity = (1 - (p - 0.6) / 0.4) * 0.85;
        if (opacity <= 0) continue;

        const side = i % 2 === 0 ? 1 : -1;
        const x = xStart + dirX * stepT + nx * side * pawOffset;
        const y = yStart + dirY * stepT + ny * side * pawOffset;

        ctx!.save();
        ctx!.globalAlpha = opacity;
        ctx!.translate(x, y);
        // 발가락(toes)이 이미지 위쪽을 향하고 있어 진행방향(angle)에서 +90도 보정
        ctx!.rotate(angle + Math.PI / 2);
        ctx!.drawImage(img, -pawW / 2, -pawH / 2, pawW, pawH);
        ctx!.restore();
      }
    }

    frameId = requestAnimationFrame(animate);

    return () => {
      destroyed = true;
      cancelAnimationFrame(frameId);
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
