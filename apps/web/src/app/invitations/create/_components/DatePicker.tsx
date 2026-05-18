"use client";

import { useState, useRef, useEffect } from "react";

interface DatePickerProps {
  value: string; // YYYY.MM.DD
  onChange: (value: string) => void;
}

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function firstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export default function DatePicker({ value, onChange }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const today = new Date();
  const parsed = value ? value.split(".").map(Number) : null;
  const selectedYear = parsed?.[0] ?? null;
  const selectedMonth = parsed?.[1] ? parsed[1] - 1 : null;
  const selectedDay = parsed?.[2] ?? null;

  const [viewYear, setViewYear] = useState(selectedYear ?? today.getFullYear());
  const [viewMonth, setViewMonth] = useState(selectedMonth ?? today.getMonth());

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const totalDays = daysInMonth(viewYear, viewMonth);
  const startDay = firstDayOfMonth(viewYear, viewMonth);

  const cells: (number | null)[] = [
    ...Array(startDay).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ];

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  };

  const select = (day: number) => {
    const mm = String(viewMonth + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    onChange(`${viewYear}.${mm}.${dd}`);
    setOpen(false);
  };

  const isSelected = (day: number) =>
    selectedYear === viewYear && selectedMonth === viewMonth && selectedDay === day;

  const isToday = (day: number) =>
    today.getFullYear() === viewYear && today.getMonth() === viewMonth && today.getDate() === day;

  return (
    <div ref={ref} className="relative flex-1">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full bg-[#f5f3f3] text-left text-base px-4 py-3 rounded-lg flex items-center justify-between cursor-pointer"
      >
        <span className={value ? "text-[#1b1c1c]" : "text-[#6b7280]"}>
          {value || "YYYY.MM.DD"}
        </span>
        <CalendarIcon />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-white rounded-xl shadow-xl border border-[#e4e2e2] p-4 w-72">
          {/* 헤더 */}
          <div className="flex items-center justify-between mb-3">
            <button type="button" onClick={prevMonth} className="p-1 hover:text-[#a73921] cursor-pointer">
              <ChevronLeft />
            </button>
            <span className="text-sm font-semibold text-[#1b1c1c]">
              {MONTHS[viewMonth]} {viewYear}
            </span>
            <button type="button" onClick={nextMonth} className="p-1 hover:text-[#a73921] cursor-pointer">
              <ChevronRight />
            </button>
          </div>

          {/* 요일 */}
          <div className="grid grid-cols-7 mb-1">
            {DAYS.map((d) => (
              <span key={d} className="text-center text-[10px] font-bold text-[#505f78] py-1">{d}</span>
            ))}
          </div>

          {/* 날짜 */}
          <div className="grid grid-cols-7 gap-y-0.5">
            {cells.map((day, i) =>
              day === null ? (
                <span key={`empty-${i}`} />
              ) : (
                <button
                  key={day}
                  type="button"
                  onClick={() => select(day)}
                  className={[
                    "text-center text-sm py-1.5 rounded-lg cursor-pointer transition-colors",
                    isSelected(day) ? "bg-[#a73921] text-white font-semibold" : "hover:bg-[#f5f3f3] text-[#1b1c1c]",
                    isToday(day) && !isSelected(day) ? "font-semibold text-[#a73921]" : "",
                  ].join(" ")}
                >
                  {day}
                </button>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const CalendarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#505f78" strokeWidth="1.5">
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);
const ChevronLeft = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);
const ChevronRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);
