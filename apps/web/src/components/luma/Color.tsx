"use client";

import { useState } from "react";

const COLOR_LABELS = [
  { name: "빨강", hex: "#f63b44" },
  { name: "초록", hex: "#10b981" },
  { name: "보라", hex: "#8b68f7" },
  { name: "크랜베리", hex: "#f31a7c" },
  { name: "바니", hex: "#8b68f7" },
  { name: "회색", hex: "#939597" },
  { name: "파랑", hex: "#3b82f6" },
  { name: "노랑", hex: "#eab308" },
  { name: "주황", hex: "#f97316" },
] as const;

const PICKER_COLORS = ["#f31a7c", "#8b68f7", "#3b82f6", "#10b981", "#eab308", "#f97316", "#f63b44", "#939597"];

const SCALES: Record<string, string[]> = {
  gray: ["#f7f8f9", "#ebeced", "#dee0e2", "#d2d4d7", "#b3b5b7", "#939597", "#737577", "#535557", "#333537", "#212325"],
  cranberry: ["#fef4f9", "#fde2ef", "#fcc6de", "#f98dbe", "#f6539d", "#f31a7c", "#d5176d", "#b6145d", "#98104e", "#790d3e"],
  barney: ["#f3f0ff", "#e6d9fd", "#c9b5fc", "#a88af9", "#8b68f7", "#7356e2", "#5c42cc", "#4530b5", "#2f1e9e", "#1a0e7a"],
  red: ["#fff1f2", "#ffe1e4", "#ffc5ca", "#ff9aa2", "#ff6370", "#f63b44", "#dd3038", "#b82028", "#941820", "#701018"],
  green: ["#ecfdf5", "#d1fae5", "#a7f3d0", "#6ee7b7", "#34d399", "#10b981", "#059669", "#047857", "#036548", "#025038"],
  blue: ["#eff6ff", "#dbeafe", "#bfdbfe", "#93c5fd", "#60a5fa", "#3b82f6", "#2563eb", "#1d4ed8", "#1e3a8a", "#172554"],
};

const STEPS = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

export function LumaColorLabel({ name, hex }: { name: string; hex: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm text-text-primary">
      <span className="size-2 rounded-full" style={{ backgroundColor: hex }} />
      {name}
    </span>
  );
}

export function LumaColorPicker({ value, onChange }: { value?: string; onChange?: (c: string) => void }) {
  const [selected, setSelected] = useState(value ?? PICKER_COLORS[0]);
  const pick = (c: string) => {
    setSelected(c);
    onChange?.(c);
  };
  return (
    <div className="flex flex-wrap gap-2">
      {PICKER_COLORS.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => pick(c)}
          className="relative flex size-6 items-center justify-center rounded-full"
          style={{ backgroundColor: c }}
          aria-label={`Color ${c}`}
        >
          {selected === c ? <span className="size-2 rounded-full bg-white" /> : null}
        </button>
      ))}
      <button
        type="button"
        className="size-6 rounded-full"
        style={{ background: "conic-gradient(red, yellow, lime, aqua, blue, magenta, red)" }}
        aria-label="Custom color"
      />
    </div>
  );
}

export function LumaColorScale({ name }: { name: keyof typeof SCALES }) {
  const colors = SCALES[name] ?? [];
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium capitalize text-text-primary">{name}</p>
      <div className="flex gap-0.5">
        {colors.map((hex, i) => (
          <div key={hex} className="flex flex-col items-center gap-1">
            <div className="size-8 rounded" style={{ backgroundColor: hex }} />
            <span className="text-[10px] text-text-tertiary">{STEPS[i]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function LumaColorLabels() {
  return (
    <div className="flex flex-wrap gap-4">
      {COLOR_LABELS.map((c) => (
        <LumaColorLabel key={c.name} name={c.name} hex={c.hex} />
      ))}
    </div>
  );
}

export function LumaColorScales() {
  return (
    <div className="space-y-6">
      {(Object.keys(SCALES) as Array<keyof typeof SCALES>).map((name) => (
        <LumaColorScale key={name} name={name} />
      ))}
    </div>
  );
}
