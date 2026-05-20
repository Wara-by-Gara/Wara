"use client";

import { useState, useRef, useEffect } from "react";

interface TimePickerProps {
  value: string; // HH:MM (24시간)
  onChange: (value: string) => void;
}

// 12, 1, 2, ..., 11 순서 (시계 방향)
const HOURS_12 = [12, ...Array.from({ length: 11 }, (_, i) => i + 1)].map(String);
const MINUTES = ["00", "15", "30", "45"];

function to24h(h: string, m: string, period: "AM" | "PM"): string {
  let hour = parseInt(h, 10);
  if (period === "AM" && hour === 12) hour = 0;   // 12 AM = 자정 = 00시
  if (period === "PM" && hour !== 12) hour += 12;  // 12 PM = 정오 = 12시 유지
  return `${String(hour).padStart(2, "0")}:${m}`;
}

function parse24h(value: string): { h: string; m: string; period: "AM" | "PM" } {
  const parts = value.split(":");
  const hh = parts[0] ?? "0";
  const mm = parts[1] ?? "00";
  const hour = parseInt(hh, 10);
  const period: "AM" | "PM" = hour < 12 ? "AM" : "PM";
  const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return { h: String(h12), m: mm, period };
}

function formatDisplay(value: string): string {
  if (!value) return "HH:MM";
  const { h, m, period } = parse24h(value);
  return `${h}:${m} ${period}`;
}

// 12 선택 시 실제 의미 힌트
function get12Hint(h: string, m: string, period: "AM" | "PM"): string | null {
  if (h !== "12") return null;
  if (period === "AM") return `자정 (00:${m})`;
  return `정오 (12:${m})`;
}

export default function TimePicker({ value, onChange }: TimePickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const initial = value ? parse24h(value) : { h: "", m: "", period: "AM" as const };
  const [selectedH, setSelectedH] = useState(initial.h);
  const [selectedM, setSelectedM] = useState(initial.m);
  const [period, setPeriod] = useState<"AM" | "PM">(initial.period);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const emit = (h: string, m: string, p: "AM" | "PM") => {
    if (h && m) {
      onChange(to24h(h, m, p));
      setOpen(false);
    }
  };

  const selectH = (h: string) => { setSelectedH(h); emit(h, selectedM, period); };
  const selectM = (m: string) => { setSelectedM(m); emit(selectedH, m, period); };
  const selectPeriod = (p: "AM" | "PM") => {
    setPeriod(p);
    if (selectedH && selectedM) onChange(to24h(selectedH, selectedM, p));
  };

  const hint = selectedH && selectedM ? get12Hint(selectedH, selectedM, period) : null;

  return (
    <div ref={ref} className="relative flex-1">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full bg-[#f5f3f3] text-left text-base px-4 py-3 rounded-lg flex items-center justify-between cursor-pointer"
      >
        <span className={value ? "text-[#1b1c1c]" : "text-[#6b7280]"}>
          {formatDisplay(value)}
        </span>
        <ClockIcon />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-white rounded-xl shadow-xl border border-[#e4e2e2] p-3 w-56">
          {/* AM / PM 토글 */}
          <div className="flex rounded-lg overflow-hidden border border-[#e4e2e2] mb-3">
            {(["AM", "PM"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => selectPeriod(p)}
                className={[
                  "flex-1 text-sm py-2 font-semibold transition-colors cursor-pointer",
                  period === p ? "bg-[#a73921] text-white" : "bg-white text-[#505f78] hover:bg-[#f5f3f3]",
                ].join(" ")}
              >
                {p === "AM" ? "오전 AM" : "오후 PM"}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            {/* 시 (12, 1~11) */}
            <div className="flex-1">
              <p className="text-[10px] font-bold text-[#58423d] mb-1 tracking-wider">HOUR</p>
              <div className="h-44 overflow-y-auto">
                {HOURS_12.map((hr) => (
                  <button
                    key={hr}
                    type="button"
                    onClick={() => selectH(hr)}
                    className={[
                      "w-full text-center text-sm py-1.5 rounded-md cursor-pointer transition-colors",
                      selectedH === hr ? "bg-[#a73921] text-white font-semibold" : "hover:bg-[#f5f3f3] text-[#1b1c1c]",
                    ].join(" ")}
                  >
                    {hr}
                  </button>
                ))}
              </div>
            </div>

            <div className="w-px bg-[#e4e2e2]" />

            {/* 분 */}
            <div className="flex-1">
              <p className="text-[10px] font-bold text-[#58423d] mb-1 tracking-wider">MIN</p>
              <div className="flex flex-col gap-0.5">
                {MINUTES.map((mn) => (
                  <button
                    key={mn}
                    type="button"
                    onClick={() => selectM(mn)}
                    className={[
                      "w-full text-center text-sm py-1.5 rounded-md cursor-pointer transition-colors",
                      selectedM === mn ? "bg-[#a73921] text-white font-semibold" : "hover:bg-[#f5f3f3] text-[#1b1c1c]",
                    ].join(" ")}
                  >
                    {mn}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 12시 선택 시 자정/정오 힌트 */}
          {hint && (
            <p className="mt-2 text-center text-[11px] text-[#a73921] font-semibold border-t border-[#f5f3f3] pt-2">
              {hint}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

const ClockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#505f78" strokeWidth="1.5">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);
