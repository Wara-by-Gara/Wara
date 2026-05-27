"use client";

import { forwardRef, useState, useId } from "react";
import { Switch } from "@/components/primitives/Switch";
import { cn } from "@/lib/cn";

export interface DateTimeSelectorProps {
  /** 셀렉터 종류 */
  mode: "date" | "time" | "date-range" | "time-range";
  /** 라벨 */
  label?: string;
  /** 시작 값 */
  value?: string;
  /** 종료 값 (range 모드) */
  endValue?: string;
  /** 변경 콜백 */
  onChange?: (value: string) => void;
  /** 종료값 변경 콜백 */
  onEndChange?: (value: string) => void;
  /** "정해지지 않음" 토글 표시 */
  unknownToggle?: boolean;
  /** 토글 ON 상태 */
  unknown?: boolean;
  /** 토글 변경 콜백 */
  onUnknownChange?: (unknown: boolean) => void;
  /** 에러 메시지 */
  error?: string;
  disabled?: boolean;
  className?: string;
}

const inputClass =
  "h-12 w-full rounded-2xl border border-border-strong bg-surface px-4 text-[15px] text-text-primary outline-none focus:border-primary";

export const DateTimeSelector = forwardRef<HTMLDivElement, DateTimeSelectorProps>(
  function DateTimeSelector(
    {
      mode,
      label,
      value,
      endValue,
      onChange,
      onEndChange,
      unknownToggle,
      unknown,
      onUnknownChange,
      error,
      disabled,
      className,
    },
    ref,
  ) {
    const id = useId();
    const [internalUnknown, setInternalUnknown] = useState(unknown ?? false);
    const isUnknown = unknownToggle ? (unknown ?? internalUnknown) : false;

    const inputType = mode.startsWith("date") ? "date" : "time";
    const isRange = mode.endsWith("range");

    return (
      <div ref={ref} className={cn("flex flex-col gap-1.5", className)}>
        {label ? (
          <label htmlFor={id} className="text-[14px] font-medium text-text-primary">
            {label}
          </label>
        ) : null}

        <div className={cn("flex items-center gap-2", isUnknown && "opacity-40")}>
          {inputType === "time" ? (
            <>
              <select
                id={id}
                value={value ?? ""}
                onChange={(e) => onChange?.(e.target.value)}
                disabled={disabled || isUnknown}
                className={cn(inputClass, "cursor-pointer")}
              >
                <option value="">시간 선택</option>
                {Array.from({ length: 48 }, (_, i) => {
                  const h = String(Math.floor(i / 2)).padStart(2, "0");
                  const m = i % 2 === 0 ? "00" : "30";
                  return <option key={i} value={`${h}:${m}`}>{`${h}:${m}`}</option>;
                })}
              </select>
              {isRange ? (
                <>
                  <span className="text-text-tertiary">~</span>
                  <select
                    value={endValue ?? ""}
                    onChange={(e) => onEndChange?.(e.target.value)}
                    disabled={disabled || isUnknown}
                    className={cn(inputClass, "cursor-pointer")}
                  >
                    <option value="">시간 선택</option>
                    {Array.from({ length: 48 }, (_, i) => {
                      const h = String(Math.floor(i / 2)).padStart(2, "0");
                      const m = i % 2 === 0 ? "00" : "30";
                      return <option key={i} value={`${h}:${m}`}>{`${h}:${m}`}</option>;
                    })}
                  </select>
                </>
              ) : null}
            </>
          ) : (
            <>
              <input
                id={id}
                type="date"
                value={value ?? ""}
                onChange={(e) => onChange?.(e.target.value)}
                disabled={disabled || isUnknown}
                className={inputClass}
              />
              {isRange ? (
                <>
                  <span className="text-text-tertiary">~</span>
                  <input
                    type="date"
                    value={endValue ?? ""}
                    onChange={(e) => onEndChange?.(e.target.value)}
                    disabled={disabled || isUnknown}
                    className={inputClass}
                  />
                </>
              ) : null}
            </>
          )}
        </div>

        {unknownToggle ? (
          <label className="flex items-center justify-between gap-3 rounded-2xl bg-gray-50 px-4 py-2.5">
            <span className="text-[14px] text-text-secondary">아직 정해지지 않았어요</span>
            <Switch
              checked={isUnknown}
              onCheckedChange={(checked) => {
                setInternalUnknown(checked);
                onUnknownChange?.(checked);
              }}
              disabled={disabled}
            />
          </label>
        ) : null}

        {error ? <span className="text-[13px] text-danger">{error}</span> : null}
      </div>
    );
  },
);
