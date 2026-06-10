"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, useState } from "react";
import { cn } from "@/lib/cn";

export type RSVPValue = "attending" | "maybe" | "declined";

const OPTIONS: { value: RSVPValue; label: string; activeColor: string }[] = [
  { value: "attending", label: "참석 👍", activeColor: "bg-green-50 text-green-600 border-green-200" },
  { value: "maybe", label: "미정 🤔", activeColor: "bg-yellow-50 text-yellow-600 border-yellow-200" },
  { value: "declined", label: "불참 😢", activeColor: "bg-red-50 text-red-600 border-red-200" },
];

const groupVariants = cva("w-full", {
  variants: {
    layout: {
      "horizontal-3": "grid grid-cols-3 gap-2",
      card: "flex flex-col gap-2",
      "full-width-stack": "flex flex-col gap-2",
    },
    shape: {
      rounded: "",
      pill: "",
    },
    disabled: {
      true: "opacity-40 pointer-events-none",
      false: "",
    },
  },
  defaultVariants: { layout: "horizontal-3", shape: "rounded", disabled: false },
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
      shape,
      disabled,
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
    const isPill = (shape ?? "rounded") === "pill";

    const handleSelect = (next: RSVPValue) => {
      if (value === undefined) setInternalValue(next);
      onValueChange?.(next);
    };

    type ResolvedOption = { value: RSVPValue; emoji?: string; label: string; activeColor: string };
    const resolvedOptions: ResolvedOption[] = options
      ? options.map((o) => ({ ...o, activeColor: OPTIONS.find((d) => d.value === o.value)?.activeColor ?? "" }))
      : OPTIONS;

    return (
      <div ref={ref} className={cn(groupVariants({ layout, shape, disabled: closed || loading || disabled }), className)}>
        {resolvedOptions.map((opt) => {
          const active = current === opt.value;
          const itemDisabled =
            closed || loading || disabled || (fullCapacity && opt.value === "attending");
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={active}
              disabled={itemDisabled}
              onClick={() => handleSelect(opt.value)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 font-semibold",
                isPill ? "rounded-xs border" : "rounded-xs border-2",
                isHorizontal ? "h-[68px] text-[13px]" : "h-[60px] px-5 text-[15px]",
                active
                  ? opt.activeColor
                  : isPill
                    ? "border-border bg-surface text-text-primary hover:bg-gray-50 transition-colors duration-150"
                    : "border-border-strong bg-surface text-text-primary hover:bg-gray-50 transition-colors duration-150",
                "disabled:cursor-not-allowed disabled:opacity-40",
              )}
            >
              {opt.emoji && <span className="text-[20px] leading-none">{opt.emoji}</span>}
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
