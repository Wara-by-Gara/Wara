"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/cn";

/**
 * 명화 패러디 갤러리 — 미술관 벽 layout.
 * 가운데 큰 액자 1장 + 4 모서리 작은 액자 4장 = 5장 동시 표시.
 * 일정 주기로 가운데 메인이 다음 명화로 회전, 나머지도 같이 한 칸씩 이동.
 * 각 액자 안에서 OPEN ↔ CLOSED 페어 모션이 독립 박자로 교차.
 */

const BASE = "/template_images/masterpiece";
const FRAME_PNG = `${BASE}/frame-overlay.png?v=3`;

interface Frame {
  open: string;
  closed: string;
  pairAnim: string;
}

const V = "?v=3";
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

// 슬롯 5개: 0 = 가운데 큰, 1~4 = 모서리 작은 (TL/TR/BL/BR)
const SLOTS = [
  { left: "26%", top: "14%", width: "48%", height: "72%", zIndex: 2 }, // 0 center
  { left: "3%", top: "3%", width: "20%", height: "26%", zIndex: 1 }, // 1 TL
  { left: "77%", top: "3%", width: "20%", height: "26%", zIndex: 1 }, // 2 TR
  { left: "3%", top: "71%", width: "20%", height: "26%", zIndex: 1 }, // 3 BL
  { left: "77%", top: "71%", width: "20%", height: "26%", zIndex: 1 }, // 4 BR
];

const ROTATE_INTERVAL_MS = 6000;

export function MasterpieceSlideLayer({ className }: { className?: string }) {
  const [centerIdx, setCenterIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setCenterIdx((c) => (c + 1) % FRAMES.length);
    }, ROTATE_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  // 각 명화의 현재 슬롯 = (i - centerIdx) 회전
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
        const slot = SLOTS[slotIndexOf(i)]!;
        return (
          <div
            key={i}
            className="masterpiece-frame absolute overflow-hidden transition-all duration-700 ease-in-out"
            style={slot}
          >
            {/* 명화는 액자 hole 영역 안쪽에만 표시 (thin 액자 기준 inset ~8%) */}
            <div className="absolute inset-[8%]">
              <Image
                src={frame.open}
                alt=""
                fill
                sizes="50vw"
                className="object-contain"
                priority={i === 0}
              />
              <Image
                src={frame.closed}
                alt=""
                fill
                sizes="50vw"
                className={cn("object-contain", frame.pairAnim)}
              />
            </div>
            {/* 금색 바로크 액자 PNG overlay — 가장자리 장식, 가운데 투명 */}
            <Image
              src={FRAME_PNG}
              alt=""
              fill
              sizes="50vw"
              className="pointer-events-none object-fill"
            />
          </div>
        );
      })}
    </div>
  );
}
