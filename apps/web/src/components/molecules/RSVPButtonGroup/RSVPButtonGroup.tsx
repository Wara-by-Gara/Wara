"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, useState } from "react";
import { cn } from "@/lib/cn";

export type RSVPValue = "attending" | "maybe" | "declined";

const OPTIONS: { value: RSVPValue; label: string; activeColor: string }[] = [
  { value: "attending", label: "참석", activeColor: "bg-primary text-text-inverse border-primary" },
  { value: "maybe", label: "미정", activeColor: "bg-yellow-300 text-gray-900 border-yellow-300" },
  { value: "declined", label: "불참", activeColor: "bg-gray-800 text-text-inverse border-gray-800" },
];

const groupVariants = cva("w-full", {
  variants: {
    layout: {
      "horizontal-3": "grid grid-cols-3 gap-2",
      card: "flex flex-col gap-2",
      "full-width-stack": "flex flex-col gap-2",
    },
    disabled: {
      true: "opacity-40 pointer-events-none",
      false: "",
    },
  },
  defaultVariants: { layout: "horizontal-3", disabled: false },
});

export interface RsvpOptionConfig {
  value: RSVPValue;
  emoji: string;
  label: string;
}

export interface RSVPButtonGroupProps extends VariantProps<typeof groupVariants> {
  value?: RSVPValue;
  onValueChange?: (value: RSVPValue) => void;
  /** 호스트 커스텀 RSVP 옵션 — 없으면 기본값(참석/미정/불참) 사용 */
  options?: RsvpOptionConfig[];
  /** 정원 초과 — 참석만 비활성 */
  fullCapacity?: boolean;
  /** 마감됨 — 전체 비활성 */
  closed?: boolean;
  /** 제출 중 */
  loading?: boolean;
  /** 추가 정보 (마감/정원초과/제출 완료 등 표시) */
  helperText?: string;
  className?: string;
}

export const RSVPButtonGroup = forwardRef<HTMLDivElement, RSVPButtonGroupProps>(
  function RSVPButtonGroup(
    {
      value,
      onValueChange,
      options,
      layout,
      fullCapacity,
      closed,
      loading,
      helperText,
      className,
    },
    ref,
  ) {
    const [internalValue, setInternalValue] = useState<RSVPValue | undefined>(undefined);
    const current = value !== undefined ? value : internalValue;
    const isHorizontal = (layout ?? "horizontal-3") === "horizontal-3";

    const handleSelect = (next: RSVPValue) => {
      if (value === undefined) setInternalValue(next);
      onValueChange?.(next);
    };

    type ResolvedOption = { value: RSVPValue; emoji?: string; label: string; activeColor: string };
    const resolvedOptions: ResolvedOption[] = options
      ? options.map((o) => ({ ...o, activeColor: OPTIONS.find((d) => d.value === o.value)?.activeColor ?? "" }))
      : OPTIONS;

    return (
      <div ref={ref} className={cn(groupVariants({ layout, disabled: closed || loading }), className)}>
        {resolvedOptions.map((opt) => {
          const active = current === opt.value;
          const itemDisabled =
            closed || loading || (fullCapacity && opt.value === "attending");
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={active}
              disabled={itemDisabled}
              onClick={() => handleSelect(opt.value)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 rounded-2xl border-2 font-bold transition-colors",
                isHorizontal ? "h-16 text-[13px]" : "h-14 px-5 text-[15px]",
                active
                  ? opt.activeColor
                  : "border-border-strong bg-surface text-text-primary hover:bg-gray-50",
                "disabled:cursor-not-allowed disabled:opacity-40",
              )}
            >
              {opt.emoji && <span className="text-[22px] leading-none">{opt.emoji}</span>}
              <span>{opt.label}</span>
            </button>
          );
        })}
        {helperText ? (
          <p className="col-span-3 mt-1 text-[13px] text-text-tertiary">{helperText}</p>
        ) : null}
      </div>
    );
  },
);
