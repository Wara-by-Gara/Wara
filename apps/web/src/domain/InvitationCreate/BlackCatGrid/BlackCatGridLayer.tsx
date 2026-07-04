"use client";

import Image from "next/image";
import { cn } from "@/lib/cn";

/**
 * 검은 고양이 그리드 배경 — 반응형:
 * - 모바일/태블릿: 2열 4행 (8셀, 9번째 셀 숨김)
 * - 데스크톱 lg+: 3열 3행 (9셀 전부)
 * 셀 0·8: 깜빡임 페어 / 셀 3: 혀 낼름 / 셀 5: 윙크 / 셀 1: 신난 / 셀 4: 초롱초롱 /
 * 셀 6: 꼬리 흔들 / 셀 7: belly popup / 셀 2: 코 골이.
 */

const BASE = "/template_images/blackcat";

const BLINK_OPEN = `${BASE}/blackcat-base.png`;
const BLINK_CLOSED = `${BASE}/blackcat-blink.png`;
const BLEP_OPEN = `${BASE}/blackcat-blep-base.png`;
const BLEP_CLOSED = `${BASE}/blackcat-blep.png`;
const WINK_OPEN = `${BASE}/blackcat-wink-base.png`;
const WINK_CLOSED = `${BASE}/blackcat-wink.png`;
const EXCITED_OPEN = `${BASE}/blackcat-excited-base.png`;
const EXCITED_CLOSED = `${BASE}/blackcat-excited.png`;
const INNOCENT_OPEN = `${BASE}/blackcat-brave.png`;
const INNOCENT_CLOSED = `${BASE}/blackcat-innocent.png`;
const SLEEP_OPEN = `${BASE}/blackcat-sleep.png`;
const SLEEP_CLOSED = `${BASE}/blackcat-snore.png?v=5`;

type Cell =
  | { kind: "blink"; delay: number }
  | { kind: "blep"; delay: number }
  | { kind: "wink"; delay: number }
  | { kind: "excited"; delay: number }
  | { kind: "innocent"; delay: number }
  | { kind: "sleep"; delay: number }
  | { kind: "popup"; src: string; delay: number; bgColor: string }
  | { kind: "wag"; src: string }
  | { kind: "static"; src: string };

const CELLS: Cell[] = [
  { kind: "blink", delay: 0 },
  { kind: "excited", delay: 3.6 },
  { kind: "sleep", delay: 2.8 },
  { kind: "blep", delay: 1.2 },
  { kind: "innocent", delay: 4.4 },
  { kind: "wink", delay: 0.6 },
  { kind: "wag", src: `${BASE}/blackcat-back.png` },
  { kind: "popup", src: `${BASE}/blackcat-belly.png`, delay: 1.8, bgColor: "#BCC79D" },
  { kind: "blink", delay: 2.4 },
];

function PairCell({
  openSrc,
  closedSrc,
  animClass,
  delay,
  objectPosition,
  cellClassName,
}: {
  openSrc: string;
  closedSrc: string;
  animClass: string;
  delay: number;
  objectPosition?: string;
  cellClassName?: string;
}) {
  const posStyle = objectPosition ? { objectPosition } : undefined;
  return (
    <div className={cn("relative overflow-hidden", cellClassName)}>
      <Image
        src={openSrc}
        alt=""
        fill
        sizes="50vw"
        className="object-cover"
        style={posStyle}
      />
      <Image
        src={closedSrc}
        alt=""
        fill
        sizes="50vw"
        className={cn("object-cover", animClass)}
        style={{ animationDelay: `${delay}s`, ...posStyle }}
      />
    </div>
  );
}

function StaticCell({
  src,
  cellClassName,
}: {
  src: string;
  cellClassName?: string;
}) {
  return (
    <div className={cn("relative overflow-hidden", cellClassName)}>
      <Image src={src} alt="" fill sizes="50vw" className="object-cover" />
    </div>
  );
}

function SleepCell({
  delay,
  objectPosition,
  cellClassName,
}: {
  delay: number;
  objectPosition?: string;
  cellClassName?: string;
}) {
  const posStyle = objectPosition ? { objectPosition } : undefined;
  return (
    <div className={cn("relative overflow-hidden", cellClassName)}>
      <Image
        src={SLEEP_OPEN}
        alt=""
        fill
        sizes="50vw"
        className="object-cover"
        style={posStyle}
      />
      <Image
        src={SLEEP_CLOSED}
        alt=""
        fill
        sizes="50vw"
        className="animate-blackcat-snore object-cover"
        style={{ animationDelay: `${delay}s`, ...posStyle }}
      />
    </div>
  );
}

function WagCell({
  src,
  cellClassName,
}: {
  src: string;
  cellClassName?: string;
}) {
  return (
    <div className={cn("relative overflow-hidden", cellClassName)}>
      <Image src={src} alt="" fill sizes="50vw" className="object-cover" />
      <Image
        src={src}
        alt=""
        fill
        sizes="50vw"
        className="animate-blackcat-tail-wag scale-x-[-1] object-cover"
      />
    </div>
  );
}

function PopupCell({
  src,
  delay,
  bgColor,
  cellClassName,
}: {
  src: string;
  delay: number;
  bgColor: string;
  cellClassName?: string;
}) {
  return (
    <div
      className={cn("relative overflow-hidden", cellClassName)}
      style={{ backgroundColor: bgColor }}
    >
      <Image
        src={src}
        alt=""
        fill
        sizes="50vw"
        className="animate-blackcat-popup object-cover"
        style={{ animationDelay: `${delay}s` }}
      />
    </div>
  );
}

export function BlackCatGridLayer({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 grid grid-cols-2 grid-rows-4 lg:grid-cols-3 lg:grid-rows-3",
        className,
      )}
    >
      {CELLS.map((cell, i) => {
        // 9번째 셀(index 8)은 lg에서만 표시 — 모바일은 2x4=8셀로 맞춤
        const cellClassName = i === 8 ? "hidden lg:block" : undefined;
        if (cell.kind === "blink") {
          return (
            <PairCell
              key={i}
              openSrc={BLINK_OPEN}
              closedSrc={BLINK_CLOSED}
              animClass="animate-blackcat-blink"
              delay={cell.delay}
              cellClassName={cellClassName}
            />
          );
        }
        if (cell.kind === "blep") {
          return (
            <PairCell
              key={i}
              openSrc={BLEP_OPEN}
              closedSrc={BLEP_CLOSED}
              animClass="animate-blackcat-blep"
              delay={cell.delay}
              cellClassName={cellClassName}
            />
          );
        }
        if (cell.kind === "wink") {
          return (
            <PairCell
              key={i}
              openSrc={WINK_OPEN}
              closedSrc={WINK_CLOSED}
              animClass="animate-blackcat-wink"
              delay={cell.delay}
              cellClassName={cellClassName}
            />
          );
        }
        if (cell.kind === "excited") {
          return (
            <PairCell
              key={i}
              openSrc={EXCITED_OPEN}
              closedSrc={EXCITED_CLOSED}
              animClass="animate-blackcat-excited"
              delay={cell.delay}
              cellClassName={cellClassName}
            />
          );
        }
        if (cell.kind === "innocent") {
          return (
            <PairCell
              key={i}
              openSrc={INNOCENT_OPEN}
              closedSrc={INNOCENT_CLOSED}
              animClass="animate-blackcat-innocent"
              delay={cell.delay}
              cellClassName={cellClassName}
            />
          );
        }
        if (cell.kind === "sleep") {
          return (
            <SleepCell
              key={i}
              delay={cell.delay}
              objectPosition="50% 25%"
              cellClassName={cellClassName}
            />
          );
        }
        if (cell.kind === "wag") {
          return (
            <WagCell key={i} src={cell.src} cellClassName={cellClassName} />
          );
        }
        if (cell.kind === "popup") {
          return (
            <PopupCell
              key={i}
              src={cell.src}
              delay={cell.delay}
              bgColor={cell.bgColor}
              cellClassName={cellClassName}
            />
          );
        }
        return (
          <StaticCell key={i} src={cell.src} cellClassName={cellClassName} />
        );
      })}
    </div>
  );
}
