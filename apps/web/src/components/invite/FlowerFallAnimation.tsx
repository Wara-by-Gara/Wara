'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/cn';

const FLOWER_SRCS = [
  '/flowers/flower-1.png',
  '/flowers/flower-2.png',
  '/flowers/flower-3.png',
  '/flowers/flower-4.png',
  '/flowers/flower-5.png',
  '/flowers/flower-6.png',
  '/flowers/flower-7.png',
];

// blur 레벨 4단계 — 시작 시 오프스크린 캔버스에 한 번만 렌더링해서 캐싱
const BLUR_LEVELS = [0, 1.2, 2.4, 3.5] as const;
const OFFSCREEN_SIZE = 320; // 최대 크기(160px) × DPR 2 = 320px — 레티나에서 upscale 없음
const COUNT = 20;

interface Petal {
  x: number;
  y: number;
  vy: number;
  rotation: number;
  rotSpeed: number;
  swayAngle: number;
  swaySpeed: number;
  size: number;
  opacity: number;
  imgIdx: number;
  blurIdx: number;
}

function makePetal(W: number, H: number, initial: boolean): Petal {
  const size = 56 + Math.random() * 72;
  const depth = (size - 56) / 72; // 0(멀다) ~ 1(가깝다)
  return {
    x: Math.random() * W,
    y: initial ? Math.random() * H * 1.1 - H * 0.05 : -size - Math.random() * 60,
    vy: 38 + depth * 42 + Math.random() * 18,
    rotation: Math.random() * Math.PI * 2,
    rotSpeed: (Math.random() - 0.5) * 1.0,
    swayAngle: Math.random() * Math.PI * 2,
    swaySpeed: 0.5 + Math.random() * 0.7,
    size,
    opacity: 0.45 + depth * 0.45,
    imgIdx: Math.floor(Math.random() * FLOWER_SRCS.length),
    blurIdx: Math.round((1 - depth) * (BLUR_LEVELS.length - 1)),
  };
}

/** 이미지를 blur 적용해 오프스크린 캔버스에 한 번만 렌더 */
function prerenderBlurred(img: HTMLImageElement, blurPx: number): HTMLCanvasElement {
  const pad = Math.ceil(blurPx * 3);
  const total = OFFSCREEN_SIZE + pad * 2;
  const oc = document.createElement('canvas');
  oc.width = total;
  oc.height = total;
  const octx = oc.getContext('2d')!;
  if (blurPx > 0) octx.filter = `blur(${blurPx}px)`;
  octx.drawImage(img, pad, pad, OFFSCREEN_SIZE, OFFSCREEN_SIZE);
  return oc;
}

interface Props {
  className?: string;
}

export function FlowerFallAnimation({ className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let destroyed = false;
    let frameId: number;
    let lastTime = performance.now();

    // cache[imgIdx][blurIdx] = 미리 렌더된 오프스크린 캔버스
    const cache: (HTMLCanvasElement | null)[][] = FLOWER_SRCS.map(() =>
      Array(BLUR_LEVELS.length).fill(null),
    );

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

    const petals: Petal[] = Array.from({ length: COUNT }, () =>
      makePetal(W0, H0, true),
    );
    // 작은(멀리) 것 먼저 그려서 큰(가까운) 것이 위에 오도록 초기 정렬
    petals.sort((a, b) => a.size - b.size);

    FLOWER_SRCS.forEach((src, imgIdx) => {
      const img = new Image();
      img.onload = () => {
        if (destroyed) return;
        BLUR_LEVELS.forEach((blurPx, blurIdx) => {
          cache[imgIdx]![blurIdx] = prerenderBlurred(img, blurPx);
        });
      };
      img.src = src;
    });

    function animate(now: number) {
      if (destroyed) return;
      frameId = requestAnimationFrame(animate);

      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      const W = canvas!.offsetWidth;
      const H = canvas!.offsetHeight;

      ctx!.clearRect(0, 0, W, H);

      for (let i = 0; i < petals.length; i++) {
        const p = petals[i]!;

        p.swayAngle += p.swaySpeed * dt;
        p.x += Math.sin(p.swayAngle) * 22 * dt;
        p.y += p.vy * dt;
        p.rotation += p.rotSpeed * dt;

        if (p.y > H + p.size) {
          petals[i] = makePetal(W, H, false);
          continue;
        }

        const cached = cache[p.imgIdx]?.[p.blurIdx];
        if (!cached) continue;

        const blurPx = BLUR_LEVELS[p.blurIdx] ?? 0;
        const pad = Math.ceil(blurPx * 3);
        const total = OFFSCREEN_SIZE + pad * 2;
        // 패딩 포함한 오프스크린 캔버스 전체를 그리되 화면 크기는 size에 맞춤
        const drawSize = p.size * (total / OFFSCREEN_SIZE);

        ctx!.save();
        ctx!.globalAlpha = p.opacity;
        ctx!.translate(p.x, p.y);
        ctx!.rotate(p.rotation);
        ctx!.drawImage(cached, -drawSize / 2, -drawSize / 2, drawSize, drawSize);
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
