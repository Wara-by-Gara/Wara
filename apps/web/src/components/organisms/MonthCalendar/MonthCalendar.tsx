"use client";

import { Icon } from "@/components/icons";
import { cn } from "@/lib/cn";

const DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

function toKey(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export interface MonthCalendarProps {
  /** 표시 연도 */
  year: number;
  /** 표시 월 (1~12) */
  month: number;
  /** 강조할 날짜 키 집합 ('YYYY-MM-DD'). 단일/다중 선택 의미는 부모가 관리 */
  selectedKeys: Set<string>;
  onDayClick: (key: string) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  /** 전달 시 "오늘" 버튼 노출 */
  onToday?: () => void;
  /** true면 오늘 이전 날짜 비활성 */
  disablePast?: boolean;
  /** 날짜별 일정 썸네일 URL. 전달 시 일정 표시 캘린더 모드로 렌더 */
  getDayThumbnails?: (key: string) => string[];
}

export function MonthCalendar({
  year,
  month,
  selectedKeys,
  onDayClick,
  onPrevMonth,
  onNextMonth,
  onToday,
  disablePast,
  getDayThumbnails,
}: MonthCalendarProps) {
  const firstDay = new Date(year, month - 1, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month, 0).getDate();
  const today = new Date();
  const todayKey = toKey(today.getFullYear(), today.getMonth() + 1, today.getDate());

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const isEventMode = !!getDayThumbnails;

  return (
    <div className="rounded-md border border-border bg-surface p-4">
      {/* Month nav */}
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={onPrevMonth}
          aria-label="이전 달"
          className="flex size-8 items-center justify-center rounded-full hover:bg-gray-50 transition-colors duration-150"
        >
          <Icon name="chevron-left" size="sm" color="inactive" decorative />
        </button>
        <div className="flex items-center gap-2">
          <span className="text-[15px] font-bold text-text-primary">
            {year}년 {month}월
          </span>
          {onToday && (
            <button
              type="button"
              onClick={onToday}
              className="rounded-full border border-border px-2.5 py-0.5 text-[12px] font-semibold text-text-secondary hover:bg-gray-50 transition-colors duration-150"
            >
              오늘
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={onNextMonth}
          aria-label="다음 달"
          className="flex size-8 items-center justify-center rounded-full hover:bg-gray-50 transition-colors duration-150"
        >
          <Icon name="chevron-right" size="sm" color="inactive" decorative />
        </button>
      </div>

      {/* Day headers */}
      <div className="mb-1 grid grid-cols-7">
        {DAY_LABELS.map((d, i) => (
          <span
            key={d}
            className={cn(
              "text-center text-[12px] font-bold",
              i === 0 ? "text-rose-400" : i === 6 ? "text-blue-400" : "text-text-tertiary",
            )}
          >
            {d}
          </span>
        ))}
      </div>

      {/* Date cells */}
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((day, i) => {
          if (!day) return <span key={`e-${i}`} />;
          const key = toKey(year, month, day);
          const isPast = key < todayKey;
          const isSelected = selectedKeys.has(key);
          const isToday = key === todayKey;
          const dow = i % 7;

          if (isEventMode) {
            const thumbs = getDayThumbnails(key);
            const hasThumb = thumbs.length > 0;
            return (
              <button
                key={key}
                type="button"
                onClick={() => onDayClick(key)}
                className="flex min-h-[46px] items-center justify-center rounded-sm p-1 hover:bg-gray-50 transition-colors duration-150"
              >
                {hasThumb ? (
                  <span
                    className={cn(
                      "relative mx-auto aspect-square w-[88%]",
                      isSelected && "rounded-md ring-2 ring-primary ring-offset-1",
                    )}
                  >
                    {thumbs.slice(0, 3).map((src, idx, arr) => (
                      <span
                        key={`${key}-${idx}`}
                        className="absolute inset-0 overflow-hidden rounded-md border border-white shadow-sm"
                        style={{
                          transform: `rotate(${(idx - (arr.length - 1) / 2) * 7}deg) scale(${1 - idx * 0.05})`,
                          zIndex: idx,
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={src} alt="" className="h-full w-full object-cover" />
                      </span>
                    ))}
                    {thumbs.length > 1 ? (
                      <span className="absolute -right-0.5 -top-0.5 z-10 flex size-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-white">
                        {thumbs.length}
                      </span>
                    ) : null}
                  </span>
                ) : (
                  <span
                    className={cn(
                      "flex size-7 items-center justify-center rounded-full text-[13px] font-semibold",
                      isSelected
                        ? "bg-primary text-white"
                        : isToday
                          ? "text-primary"
                          : dow === 0
                            ? "text-rose-400"
                            : dow === 6
                              ? "text-blue-400"
                              : "text-text-primary",
                    )}
                  >
                    {day}
                  </span>
                )}
              </button>
            );
          }

          return (
            <button
              key={key}
              type="button"
              disabled={disablePast && isPast}
              onClick={() => onDayClick(key)}
              className={cn(
                "mx-auto flex size-9 items-center justify-center rounded-full text-[14px] font-semibold",
                !(disablePast && isPast) && "hover:bg-gray-50 transition-colors duration-150",
                disablePast && isPast
                  ? "cursor-not-allowed text-gray-300 line-through opacity-50"
                  : isSelected
                    ? "bg-primary text-white shadow-sm"
                    : dow === 0
                      ? "text-rose-400"
                      : dow === 6
                        ? "text-blue-400"
                        : "text-text-primary",
              )}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
