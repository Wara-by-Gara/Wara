"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Props = {
  /** 표시 순서대로의 인덱스 글자 (한글14 + 영문 + #) */
  letters: string[];
  /** 실제 친구가 존재하는 초성 (나머지는 흐리게 + 점프 비활성) */
  activeSet: Set<string>;
  /** 해당 초성의 첫 친구로 스크롤 */
  onJump: (letter: string) => void;
};

// 스크롤이 멈춘 뒤 인덱스 바가 사라지기까지의 시간(ms)
const HIDE_DELAY = 1200;

export const FriendsIndexBar = ({ letters, activeSet, onJump }: Props) => {
  const barRef = useRef<HTMLDivElement>(null);
  const lastLetter = useRef<string | null>(null);
  const hideTimer = useRef<number | null>(null);
  const interacting = useRef(false);
  const [overlay, setOverlay] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  // 평소엔 숨김 → 스크롤(또는 바 조작) 중에만 노출, 멈추면 페이드 아웃
  const scheduleHide = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => {
      if (!interacting.current) setVisible(false);
    }, HIDE_DELAY);
  }, []);

  const reveal = useCallback(() => {
    setVisible(true);
    scheduleHide();
  }, [scheduleHide]);

  useEffect(() => {
    // capture:true → main 등 내부 스크롤 컨테이너의 스크롤도 잡음
    const onScroll = () => reveal();
    window.addEventListener("scroll", onScroll, true);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [reveal]);

  const handleAt = (clientY: number) => {
    const bar = barRef.current;
    if (!bar) return;
    const rect = bar.getBoundingClientRect();
    const ratio = (clientY - rect.top) / rect.height;
    const idx = Math.min(letters.length - 1, Math.max(0, Math.floor(ratio * letters.length)));
    const letter = letters[idx];
    if (letter === undefined) return;

    setOverlay(letter);
    if (letter !== lastLetter.current) {
      lastLetter.current = letter;
      if (activeSet.has(letter)) onJump(letter);
    }
  };

  const start = (e: React.PointerEvent<HTMLDivElement>) => {
    interacting.current = true;
    setVisible(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    handleAt(e.clientY);
  };

  const end = () => {
    interacting.current = false;
    setOverlay(null);
    lastLetter.current = null;
    scheduleHide();
  };

  return (
    <>
      {/* viewport 고정 + 앱 컬럼(max-w-md) 우측 정렬 레이어 */}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-20 mx-auto h-full max-w-md">
        <div
          ref={barRef}
          aria-hidden
          className={`absolute right-2.5 top-[76px] bottom-[calc(4rem+env(safe-area-inset-bottom))] flex touch-none select-none flex-col items-center justify-between py-2 transition-opacity duration-200 ${
            visible ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
          }`}
          onPointerDown={start}
          onPointerMove={(e) => {
            if (e.buttons) handleAt(e.clientY);
          }}
          onPointerUp={end}
          onPointerCancel={end}
        >
          {letters.map((letter) => (
            <span
              key={letter}
              className={`text-[14px] font-bold leading-[1.7] ${
                activeSet.has(letter) ? "text-text-muted" : "text-text-disabled/40"
              }`}
            >
              {letter}
            </span>
          ))}
        </div>
      </div>

      {overlay && (
        <div className="pointer-events-none fixed inset-0 z-30 flex items-center justify-center">
          <div className="flex size-24 items-center justify-center rounded-3xl bg-black/60 text-5xl font-bold text-white">
            {overlay}
          </div>
        </div>
      )}
    </>
  );
};
