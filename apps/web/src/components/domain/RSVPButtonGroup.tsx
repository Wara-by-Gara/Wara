"use client";

import { useRef, type KeyboardEvent } from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/cn";

/** WARA RSVP 상태 (백엔드: attending/undecided/absent) */
export type RSVPValue = "attending" | "undecided" | "absent";

export interface RSVPOption {
  emoji: string;
  label: string;
}

/** 호스트 커스텀 이모지/라벨 미지정 시 기본값 (Partiful Going/Maybe/Can't Go 대응) */
const DEFAULTS: Record<RSVPValue, RSVPOption> = {
  attending: { emoji: "❤️", label: "참석" },
  undecided: { emoji: "❤️‍🩹", label: "미정" },
  absent: { emoji: "💔", label: "불참" },
};

const ORDER: RSVPValue[] = ["attending", "undecided", "absent"];

/**
 * 프로스티드 글래스 원 — Partiful 동일 사양.
 * - 이모지 + 라벨을 원 "안"에 세로 배치
 * - 반투명 흰 frost(낮은 불투명도) + 강한 backdrop-blur → 뒤 배경색이 비쳐 보임
 * - 가장자리는 흰 glow + radial 페이드로 부드럽게 페더(하드 보더 없음)
 * - 선택 시: 선택된 원은 강조, 나머지는 dim(비활성 느낌). 검은 보더 사용 안 함.
 */
const circleVariants = cva(
  [
    "relative flex flex-col items-center justify-center rounded-full text-text",
    "backdrop-blur-[22px] transition-[transform,opacity,filter,box-shadow] duration-200",
    "[background:radial-gradient(circle_at_50%_40%,rgba(255,255,255,0.55)_0%,rgba(255,255,255,0.30)_52%,rgba(255,255,255,0.04)_100%)]",
    // 미선택에서도 뚜렷한 글래스 테두리
    "border-[1.5px] border-white/75",
    // 흰 glow로 가장자리 페더 + 살짝 떠 보이는 그림자
    "shadow-[0_0_24px_6px_rgba(255,255,255,0.42),0_14px_30px_-12px_rgba(0,0,0,0.22)]",
  ],
  {
    variants: {
      size: {
        lg: "size-[104px] gap-1.5",
        md: "size-[84px] gap-1",
      },
      state: {
        default: "hover:scale-[1.03]",
        // 선택됨: 더 진한 frost + 살짝 키움 (보더 아님)
        selected:
          "scale-[1.06] [background:radial-gradient(circle_at_50%_40%,rgba(255,255,255,0.82)_0%,rgba(255,255,255,0.5)_55%,rgba(255,255,255,0.1)_100%)] shadow-[0_0_28px_8px_rgba(255,255,255,0.55),0_16px_34px_-12px_rgba(0,0,0,0.3)]",
        // 나머지: 비활성 느낌 (흐리게 + 채도↓ + 축소)
        dimmed: "scale-95 opacity-45 saturate-[0.55]",
      },
    },
    defaultVariants: { size: "lg", state: "default" },
  },
);

export interface RSVPButtonGroupProps {
  value?: RSVPValue;
  onValueChange?: (value: RSVPValue) => void;
  /** 호스트 커스텀 이모지/라벨 (초대장 rsvp*Emoji/Label) */
  options?: Partial<Record<RSVPValue, RSVPOption>>;
  size?: "lg" | "md";
  /** 마감 — 전체 비활성 */
  closed?: boolean;
  /** 제출 중 */
  loading?: boolean;
  helperText?: string;
  className?: string;
}

export function RSVPButtonGroup({
  value,
  onValueChange,
  options,
  size = "lg",
  closed,
  loading,
  helperText,
  className,
}: RSVPButtonGroupProps) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const groupDisabled = Boolean(closed || loading);

  const resolve = (v: RSVPValue): RSVPOption => ({
    ...DEFAULTS[v],
    ...options?.[v],
  });

  const onKeyDown = (e: KeyboardEvent, idx: number) => {
    let next = idx;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (idx + 1) % ORDER.length;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (idx - 1 + ORDER.length) % ORDER.length;
    else return;
    e.preventDefault();
    if (groupDisabled) return;
    const v = ORDER[next]!;
    onValueChange?.(v);
    refs.current[next]?.focus();
  };

  const emojiSize = size === "lg" ? "text-[30px]" : "text-[24px]";

  return (
    <div className={cn("w-full", className)}>
      <div
        role="radiogroup"
        aria-label="참석 여부"
        className={cn("flex justify-center gap-4", groupDisabled && "opacity-50")}
      >
        {ORDER.map((v, i) => {
          const opt = resolve(v);
          const selected = value === v;
          const state = value == null ? "default" : selected ? "selected" : "dimmed";
          return (
            <button
              key={v}
              ref={(el) => {
                refs.current[i] = el;
              }}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={opt.label}
              tabIndex={selected || (!value && i === 0) ? 0 : -1}
              disabled={groupDisabled}
              onClick={() => onValueChange?.(v)}
              onKeyDown={(e) => onKeyDown(e, i)}
              className={cn(
                circleVariants({ size, state }),
                "focus-visible:outline-none focus-visible:[box-shadow:var(--focus-ring)]",
                "disabled:cursor-not-allowed",
              )}
            >
              <span className={cn(emojiSize, "leading-none")} aria-hidden>
                {opt.emoji}
              </span>
              <span
                className={cn(
                  "type-bodySmall leading-none",
                  selected ? "font-bold text-text" : "font-medium text-text/85",
                )}
              >
                {opt.label}
              </span>
            </button>
          );
        })}
      </div>
      {helperText ? (
        <p className="type-caption mt-3 text-center text-text-muted">{helperText}</p>
      ) : null}
    </div>
  );
}
