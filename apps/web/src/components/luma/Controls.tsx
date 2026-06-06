"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

type ToggleColor = "success" | "error" | "brand";

const TOGGLE_ON: Record<ToggleColor, string> = {
  success: "bg-green-500",
  error: "bg-red-500",
  brand: "bg-brand",
};

export function LumaToggle({
  label,
  description,
  color = "brand",
  checked,
  onChange,
  disabled,
}: {
  label: string;
  description?: string;
  color?: ToggleColor;
  checked?: boolean;
  onChange?: (v: boolean) => void;
  disabled?: boolean;
}) {
  const [on, setOn] = useState(checked ?? false);
  const isOn = checked ?? on;
  const toggle = () => {
    if (disabled) return;
    const next = !isOn;
    setOn(next);
    onChange?.(next);
  };
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border py-3">
      <div>
        <p className="text-sm font-medium text-text-primary">{label}</p>
        {description ? <p className="text-xs text-text-tertiary">{description}</p> : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={isOn}
        disabled={disabled}
        onClick={toggle}
        className={cn(
          "relative h-6 w-[38px] shrink-0 rounded-full transition-colors duration-300",
          disabled ? "bg-gray-200 opacity-50" : isOn ? TOGGLE_ON[color] : "bg-gray-300",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 size-5 rounded-full bg-white shadow-sm transition-transform duration-300",
            isOn ? "translate-x-[18px]" : "translate-x-0.5",
          )}
        />
      </button>
    </div>
  );
}

export function LumaSegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string; icon?: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex rounded-xs bg-gray-100 p-0.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            "flex items-center gap-1.5 rounded-xs px-3 py-1.5 text-sm transition-colors",
            value === opt.value ? "bg-white font-semibold text-text-primary shadow-xs" : "text-text-secondary",
          )}
        >
          {opt.icon ? <span>{opt.icon}</span> : null}
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function LumaSlider({
  value,
  onChange,
  min = 0,
  max = 100,
}: {
  value?: number;
  onChange?: (v: number) => void;
  min?: number;
  max?: number;
}) {
  const [val, setVal] = useState(value ?? 50);
  const current = value ?? val;
  const pct = ((current - min) / (max - min)) * 100;
  return (
    <div className="space-y-2">
      <div className="relative h-1.5 rounded-full bg-gray-200">
        <div className="absolute inset-y-0 left-0 rounded-full bg-brand" style={{ width: `${pct}%` }} />
        <input
          type="range"
          min={min}
          max={max}
          value={current}
          onChange={(e) => {
            const n = Number(e.target.value);
            setVal(n);
            onChange?.(n);
          }}
          className="absolute inset-0 size-full cursor-pointer opacity-0"
        />
        <span
          className="absolute top-1/2 size-4 -translate-y-1/2 rounded-full bg-white shadow-sm"
          style={{ left: `calc(${pct}% - 8px)` }}
        />
      </div>
      <p className="text-xs text-text-tertiary">{current}</p>
    </div>
  );
}

export function LumaOptionButton({
  label,
  description,
  selected,
  onClick,
}: {
  label: string;
  description?: string;
  selected?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full rounded-sm border p-4 text-left transition-colors",
        selected ? "border-brand bg-brand-soft" : "border-border-strong bg-surface hover:bg-gray-50",
      )}
    >
      <p className="text-sm font-medium text-text-primary">{label}</p>
      {description ? <p className="text-xs text-text-tertiary">{description}</p> : null}
    </button>
  );
}
