"use client";

import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/cn";

export interface AutoSlideItem {
  src: string;
  alt?: string;
}

export interface AutoSlideProps extends React.HTMLAttributes<HTMLDivElement> {
  slides: readonly AutoSlideItem[];
  /** 슬라이드 전환 간격 (ms) */
  intervalMs?: number;
  /** 비율 유틸 클래스 (기본 3:4) */
  aspectClassName?: string;
  /** 하단 인디케이터 표시 */
  showDots?: boolean;
  /** 모서리 라운드 (기본 true) */
  rounded?: boolean;
}

export function AutoSlide({
  slides,
  intervalMs = 4000,
  aspectClassName = "aspect-[3/4]",
  showDots = true,
  rounded = true,
  className,
  ...props
}: AutoSlideProps) {
  const count = slides.length;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const goTo = useCallback(
    (next: number) => {
      if (count === 0) return;
      setIndex(((next % count) + count) % count);
    },
    [count],
  );

  useEffect(() => {
    if (count <= 1 || paused) return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    const id = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % count);
    }, intervalMs);

    return () => window.clearInterval(id);
  }, [count, intervalMs, paused]);

  if (count === 0) {
    return (
      <div
        className={cn(
          "relative overflow-hidden bg-gray-100",
          rounded && "rounded-3xl",
          aspectClassName,
          className,
        )}
        {...props}
      />
    );
  }

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label="슬라이드"
      className={cn(
        "relative w-full overflow-hidden",
        rounded && "rounded-3xl",
        aspectClassName,
        className,
      )}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      {...props}
    >
      <div
        className="flex h-full transition-transform duration-500 ease-out motion-reduce:transition-none"
        style={{ transform: `translateX(-${index * 100}%)` }}
        aria-live="polite"
      >
        {slides.map((slide) => (
          <div key={slide.src} className="h-full w-full shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={slide.src}
              alt={slide.alt ?? ""}
              className="size-full object-cover"
              draggable={false}
            />
          </div>
        ))}
      </div>

      {showDots && count > 1 ? (
        <div className="absolute inset-x-0 bottom-3 flex items-center justify-center gap-1.5">
          {slides.map((slide, i) => (
            <button
              key={slide.src}
              type="button"
              aria-label={`${i + 1}번째 슬라이드`}
              aria-current={i === index ? "true" : undefined}
              onClick={() => goTo(i)}
              className={cn(
                "rounded-full transition-all",
                i === index
                  ? "h-1.5 w-6 bg-surface"
                  : "size-1.5 bg-surface/60",
              )}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
