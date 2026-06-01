"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icons";
import { StickyHeader } from "@/components/layout/StickyHeader";
import { EmptyState } from "@/components/organisms/EmptyState";
import { MonthCalendar } from "@/components/organisms/MonthCalendar";
import { useMyInvitations } from "@/hooks/useInvitations";
import type { Invitation } from "@/lib/api/invitations";
import { ROUTES } from "@/constants/routes";

const DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

function toKey(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function dateKeyOf(iso: string): string {
  const d = new Date(iso);
  return toKey(d.getFullYear(), d.getMonth() + 1, d.getDate());
}

function keyToDate(key: string): Date {
  const [y, m, d] = key.split("-").map(Number) as [number, number, number];
  return new Date(y, m - 1, d);
}

function formatDayHeader(key: string): string {
  const d = keyToDate(key);
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${DAY_LABELS[d.getDay()]}요일`;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const h = d.getHours();
  const min = d.getMinutes();
  const ampm = h < 12 ? "오전" : "오후";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return min === 0 ? `${ampm} ${h12}시` : `${ampm} ${h12}:${String(min).padStart(2, "0")}`;
}

export function Calendar() {
  const router = useRouter();
  const { data: invitations, isLoading } = useMyInvitations();

  const today = new Date();
  const todayKey = toKey(today.getFullYear(), today.getMonth() + 1, today.getDate());

  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1); // 1~12
  const [selectedKey, setSelectedKey] = useState(todayKey);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, Invitation[]>();
    (invitations ?? []).forEach((inv) => {
      if (!inv.eventStartAt) return;
      const key = dateKeyOf(inv.eventStartAt);
      const arr = map.get(key) ?? [];
      arr.push(inv);
      map.set(key, arr);
    });
    return map;
  }, [invitations]);

  const hasAnyEvent = eventsByDay.size > 0;
  const selectedEvents = eventsByDay.get(selectedKey) ?? [];

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
  const goToday = () => {
    setYear(today.getFullYear());
    setMonth(today.getMonth() + 1);
    setSelectedKey(todayKey);
  };

  const shiftDay = (delta: number) => {
    const d = keyToDate(selectedKey);
    d.setDate(d.getDate() + delta);
    setSelectedKey(toKey(d.getFullYear(), d.getMonth() + 1, d.getDate()));
    setYear(d.getFullYear());
    setMonth(d.getMonth() + 1);
  };

  const getDayThumbnails = (key: string) =>
    (eventsByDay.get(key) ?? []).map((e) => e.mainImageUrl).filter((u): u is string => !!u);

  return (
    <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col overflow-x-hidden bg-background-soft">
      <StickyHeader title="캘린더" />

      {!isLoading && !hasAnyEvent ? (
        <main className="relative z-10 flex min-h-0 flex-1 flex-col items-center justify-center px-5">
          <EmptyState
            icon="calendar"
            title="아직 일정이 없어요"
            description="초대장을 만들거나 참여하면 여기에 표시돼요"
          />
        </main>
      ) : (
        <main className="relative z-10 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 pb-4 pt-[72px]">
          <MonthCalendar
            year={year}
            month={month}
            selectedKeys={new Set([selectedKey])}
            onDayClick={setSelectedKey}
            onPrevMonth={prevMonth}
            onNextMonth={nextMonth}
            onToday={goToday}
            getDayThumbnails={getDayThumbnails}
          />

          <section className="rounded-2xl border border-border bg-surface p-4">
            <div className="mb-3 flex items-center justify-between">
              <button
                type="button"
                aria-label="이전 날"
                onClick={() => shiftDay(-1)}
                className="flex size-8 items-center justify-center rounded-full hover-emphasis-sm"
              >
                <Icon name="chevron-left" size="sm" color="inactive" decorative />
              </button>
              <span className="text-[15px] font-bold text-text-primary">
                {formatDayHeader(selectedKey)}
              </span>
              <button
                type="button"
                aria-label="다음 날"
                onClick={() => shiftDay(1)}
                className="flex size-8 items-center justify-center rounded-full hover-emphasis-sm"
              >
                <Icon name="chevron-right" size="sm" color="inactive" decorative />
              </button>
            </div>

            {selectedEvents.length === 0 ? (
              <p className="py-6 text-center text-[14px] text-text-tertiary">이 날 일정이 없어요</p>
            ) : (
              <div className="flex flex-col gap-2">
                {selectedEvents.map((ev) => (
                  <button
                    key={ev.id}
                    type="button"
                    onClick={() => router.push(ROUTES.INVITATIONS.DETAIL(ev.id))}
                    className="flex items-center gap-3 rounded-xl p-2 text-left hover-emphasis-sm"
                  >
                    <div className="size-14 shrink-0 overflow-hidden rounded-xl bg-gray-100">
                      {ev.mainImageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={ev.mainImageUrl} alt="" className="h-full w-full object-cover" />
                      ) : null}
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="text-[12px] text-text-secondary">
                        {ev.eventStartAt ? formatTime(ev.eventStartAt) : ""}
                      </span>
                      <span className="truncate text-[15px] font-bold text-text-primary">
                        {ev.title}
                      </span>
                      <span className="text-[12px] text-text-tertiary">
                        {ev.myRole === "HOST" ? "내가 주최" : "참석"}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>
        </main>
      )}
    </div>
  );
}
