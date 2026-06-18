'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/cn';

const COLORS = [
  '#c850d4', '#e91e63', '#ff6eb4', '#00d4c8',
  '#4ecdc4', '#f5e642', '#f0f3b0', '#ffffff',
  '#9b59b6', '#ff1493',
];

const DEFAULT_COUNT = 120;

interface Piece {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotSpeed: number;
  flipAngle: number;
  flipSpeed: number;
  color: string;
  w: number;
  h: number;
  shape: 'rect' | 'ribbon';
}

interface Props {
  className?: string;
  count?: number;
}

function makePiece(W: number, H: number, initial: boolean): Piece {
  return {
    x: Math.random() * W,
    y: initial ? Math.random() * H * 1.5 - H * 0.3 : -20 - Math.random() * 40,
    vx: (Math.random() - 0.5) * 60,
    vy: 80 + Math.random() * 120,
    rotation: Math.random() * Math.PI * 2,
    rotSpeed: (Math.random() - 0.5) * 4,
    flipAngle: Math.random() * Math.PI * 2,
    flipSpeed: 1.5 + Math.random() * 3,
    color: COLORS[Math.floor(Math.random() * COLORS.length)]!,
    w: 8 + Math.random() * 14,
    h: 5 + Math.random() * 9,
    shape: Math.random() < 0.28 ? 'ribbon' : 'rect',
  };
}

export function PaperConfettiAnimation({ className, count = DEFAULT_COUNT }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let destroyed = false;
    let frameId: number;
    let lastTime = performance.now();

    const pieces: Piece[] = [];

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
    for (let i = 0; i < count; i++) {
      pieces.push(makePiece(W0, H0, true));
    }

    function animate(now: number) {
      if (destroyed) return;
      frameId = requestAnimationFrame(animate);

      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      const W = canvas!.offsetWidth;
      const H = canvas!.offsetHeight;

      ctx!.clearRect(0, 0, W, H);

      for (const p of pieces) {
        // physics
        p.vx += Math.sin(p.flipAngle * 0.5) * 20 * dt;
        p.vx *= 0.99;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rotation += p.rotSpeed * dt;
        p.flipAngle += p.flipSpeed * dt;

        if (p.y > H + 30) {
          Object.assign(p, makePiece(W, H, false));
          continue;
        }

        const scaleX = Math.cos(p.flipAngle);

        ctx!.save();
        ctx!.translate(p.x, p.y);
        ctx!.rotate(p.rotation);
        ctx!.scale(scaleX, 1);
        ctx!.globalAlpha = 0.92;
        ctx!.fillStyle = p.color;

        if (p.shape === 'rect') {
          ctx!.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        } else {
          // ribbon: thin curved stroke
          ctx!.beginPath();
          ctx!.moveTo(-p.w, 0);
          ctx!.quadraticCurveTo(0, -p.h * 1.8, p.w, 0);
          ctx!.lineWidth = 2.5;
          ctx!.strokeStyle = p.color;
          ctx!.stroke();
        }

        ctx!.restore();
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
