"use client";

import { useState } from "react";
import { Input } from "@wara/ui";
import { cn } from "@/lib/cn";
import { MonthCalendar, dateKey } from "./MonthCalendar";

export interface DateTimeValue {
  /** 'YYYY-MM-DD' */
  date?: string;
  /** 'HH:mm' (24h) */
  time?: string;
}

export interface DateTimeSelectorProps {
  value: DateTimeValue;
  onChange: (value: DateTimeValue) => void;
  /** 과거 날짜 비활성 */
  disablePast?: boolean;
  className?: string;
}

function parseViewFrom(date?: string): { year: number; month: number } {
  if (date) {
    const [y, m] = date.split("-").map(Number);
    if (y && m) return { year: y, month: m };
  }
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

export function DateTimeSelector({
  value,
  onChange,
  disablePast = true,
  className,
}: DateTimeSelectorProps) {
  const initial = parseViewFrom(value.date);
  const [year, setYear] = useState(initial.year);
  const [month, setMonth] = useState(initial.month);

  const prevMonth = () => {
    if (month === 1) {
      setYear((y) => y - 1);
      setMonth(12);
    } else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) {
      setYear((y) => y + 1);
      setMonth(1);
    } else setMonth((m) => m + 1);
  };

  const selected = value.date ? new Set([value.date]) : new Set<string>();

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <MonthCalendar
        year={year}
        month={month}
        selectedKeys={selected}
        onDayClick={(key) => onChange({ ...value, date: key })}
        onPrevMonth={prevMonth}
        onNextMonth={nextMonth}
        disablePast={disablePast}
      />
      <label className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-3">
        <span className="type-body text-text">시간</span>
        <Input
          type="time"
          value={value.time ?? ""}
          onChange={(e) => onChange({ ...value, time: e.target.value })}
          className="h-10 w-[140px]"
        />
      </label>
    </div>
  );
}

export { dateKey };
