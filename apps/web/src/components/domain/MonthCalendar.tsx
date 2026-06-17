"use client";

import { IconButton } from "@wara/ui";
import { cn } from "@/lib/cn";

const DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

export function dateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export interface MonthCalendarProps {
  year: number;
  /** 1~12 */
  month: number;
  /** 강조할 'YYYY-MM-DD' 집합 (단일/다중 의미는 부모가 관리) */
  selectedKeys: Set<string>;
  onDayClick: (key: string) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  /** 있으면 헤더에 '오늘' 이동 버튼 표시 */
  onToday?: () => void;
  /** 이벤트가 있는 'YYYY-MM-DD' — 날짜 아래 점으로 표시 (imagesByKey 없을 때 폴백) */
  markedKeys?: Set<string>;
  /** 날짜별 초대장 커버 이미지 — 날짜 아래 썸네일로 표시 (여러 개면 겹침) */
  imagesByKey?: Map<string, string[]>;
  /** 오늘 이전 비활성 */
  disablePast?: boolean;
  className?: string;
}

export function MonthCalendar({
  year,
  month,
  selectedKeys,
  onDayClick,
  onPrevMonth,
  onNextMonth,
  onToday,
  markedKeys,
  imagesByKey,
  disablePast,
  className,
}: MonthCalendarProps) {
  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const today = new Date();
  const todayKey = dateKey(today.getFullYear(), today.getMonth() + 1, today.getDate());
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();

  const cells: (number | null)[] = [
    ...Array<null>(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className={cn("rounded-xl border border-border bg-surface p-4", className)}>
      <div className="mb-3 flex items-center justify-between">
        <IconButton icon="chevron-left" label="이전 달" size="sm" onClick={onPrevMonth} />
        <div className="flex items-center gap-2">
          <span className="type-cardTitle text-text">
            {year}년 {month}월
          </span>
          {onToday ? (
            <button
              type="button"
              onClick={onToday}
              className="rounded-full border border-border px-2.5 py-0.5 type-caption text-text-muted transition-colors hover:bg-surface-muted"
            >
              오늘
            </button>
          ) : null}
        </div>
        <IconButton icon="chevron-right" label="다음 달" size="sm" onClick={onNextMonth} />
      </div>

      <div className="grid grid-cols-7 gap-1">
        {DAY_LABELS.map((d, i) => (
          <div
            key={d}
            className={cn(
              "py-1 text-center type-caption font-medium",
              i === 0 ? "text-danger" : i === 6 ? "text-info" : "text-text-muted",
            )}
          >
            {d}
          </div>
        ))}

        {cells.map((day, i) => {
          if (day === null) return <div key={`e-${i}`} />;
          const key = dateKey(year, month, day);
          const selected = selectedKeys.has(key);
          const isToday = key === todayKey;
          const images = imagesByKey?.get(key)?.filter(Boolean) ?? [];
          const marked = markedKeys?.has(key);
          const past = disablePast && new Date(year, month - 1, day).getTime() < todayMidnight;
          return (
            <button
              key={key}
              type="button"
              disabled={past}
              aria-pressed={selected}
              aria-label={`${month}월 ${day}일${isToday ? " (오늘)" : ""}`}
              onClick={() => onDayClick(key)}
              className={cn(
                "relative flex aspect-square items-center justify-center rounded-full type-bodySmall transition-colors",
                "focus-visible:outline-none focus-visible:[box-shadow:var(--focus-ring)]",
                "disabled:opacity-30 disabled:pointer-events-none",
                selected
                  ? "bg-surface-inverse font-semibold text-text-inverse"
                  : cn(
                      "text-text hover:bg-surface-muted",
                      isToday && "font-bold text-accent",
                    ),
              )}
            >
              {images.length === 0 ? day : null}
              {images.length > 0 ? (
                <span className="absolute inset-1">
                  {/* 여러 개면 살짝 어긋나게 겹쳐 쌓인 카드 형태 (직사각형, 숫자 덮음) */}
                  {images.slice(0, 3).map((url, idx) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={idx}
                      src={url}
                      alt=""
                      className="absolute inset-0 size-full rounded-md object-cover ring-1 ring-surface"
                      style={{
                        transform: `translate(${idx * 2}px, ${idx * 2}px)`,
                        zIndex: 20 - idx,
                      }}
                    />
                  ))}
                </span>
              ) : marked ? (
                <span
                  className={cn(
                    "absolute bottom-1 size-1 rounded-full",
                    selected ? "bg-text-inverse" : "bg-accent",
                  )}
                />
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
