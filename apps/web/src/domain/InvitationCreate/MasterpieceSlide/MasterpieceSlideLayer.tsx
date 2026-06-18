"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/cn";

/**
 * 명화 패러디 갤러리 — 반응형:
 * - 모바일: 가운데 명화 1장 풀스크린 (다른 4장은 opacity 0, 회전 시 fade)
 * - lg+: 미술관 벽 layout (가운데 큰 + 모서리 4 작은)
 * 6초마다 메인이 다음 명화로 회전.
 * 각 액자 안에서 OPEN ↔ CLOSED 페어 모션이 독립 박자로 교차.
 */

const BASE = "/template_images/masterpiece";
const V = "?v=3";
const FRAME_PNG = `${BASE}/frame-overlay.png?v=3`;

interface Frame {
  open: string;
  closed: string;
  pairAnim: string;
}

const FRAMES: Frame[] = [
  {
    open: `${BASE}/masterpiece-mona-base.png${V}`,
    closed: `${BASE}/masterpiece-mona-closed.png${V}`,
    pairAnim: "animate-pair-bubblegum",
  },
  {
    open: `${BASE}/masterpiece-jinjugirl-base.png${V}`,
    closed: `${BASE}/masterpiece-jinjugirl-closed.png${V}`,
    pairAnim: "animate-pair-wink",
  },
  {
    open: `${BASE}/masterpiece-munk-base.png${V}`,
    closed: `${BASE}/masterpiece-munk-closed.png${V}`,
    pairAnim: "animate-pair-stunned",
  },
  {
    open: `${BASE}/masterpiece-gohu-base.png${V}`,
    closed: `${BASE}/masterpiece-gohu-closed.png${V}`,
    pairAnim: "animate-pair-clap",
  },
  {
    open: `${BASE}/masterpiece-vinus-base.png${V}`,
    closed: `${BASE}/masterpiece-vinus-closed.png${V}`,
    pairAnim: "animate-pair-wave",
  },
];

const ROTATE_INTERVAL_MS = 6000;

// 슬롯별 CSS class — 모바일에선 slot 0만 풀스크린, lg+에선 미술관 layout
const SLOT_CLASSES = [
  "mp-slot mp-slot-0",
  "mp-slot mp-slot-1",
  "mp-slot mp-slot-2",
  "mp-slot mp-slot-3",
  "mp-slot mp-slot-4",
];

export function MasterpieceSlideLayer({ className }: { className?: string }) {
  const [centerIdx, setCenterIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setCenterIdx((c) => (c + 1) % FRAMES.length);
    }, ROTATE_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  const slotIndexOf = (i: number) =>
    (i - centerIdx + FRAMES.length) % FRAMES.length;

  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 bg-[#2a1810]",
        className,
      )}
    >
      {FRAMES.map((frame, i) => {
        const slotIdx = slotIndexOf(i);
        return (
          <div
            key={i}
            className={cn(
              "masterpiece-frame overflow-hidden",
              SLOT_CLASSES[slotIdx],
            )}
          >
            {/* 명화는 액자 hole 영역 안쪽에만 표시 (thin 액자 기준 inset ~8%) */}
            <div className="absolute inset-[8%]">
              <Image
                src={frame.open}
                alt=""
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-contain"
                priority={i === 0}
              />
              <Image
                src={frame.closed}
                alt=""
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className={cn("object-contain", frame.pairAnim)}
              />
            </div>
            {/* 금색 바로크 액자 PNG overlay — 가장자리 장식, 가운데 투명 */}
            <Image
              src={FRAME_PNG}
              alt=""
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="pointer-events-none object-fill"
            />
          </div>
        );
      })}
    </div>
  );
}
