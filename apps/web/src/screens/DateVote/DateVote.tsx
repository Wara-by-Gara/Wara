"use client";

import { useState } from "react";
import { Icon } from "@/components/icons";
import { Button } from "@/components/primitives/Button";
import { Avatar } from "@/components/primitives/Avatar";
import { Badge } from "@/components/primitives/Badge";
import { TopAppBar } from "@/components/molecules/TopAppBar";
import { MainBottomNav } from "@/components/layout/MainBottomNav";
import { StickyCTA } from "@/components/layout/StickyCTA";
import { ConfirmModal } from "@/components/molecules/Modal";
import { cn } from "@/lib/cn";

// ── Types ──────────────────────────────────────────────────────────────────
type VoteResponse = "circle" | "triangle" | "cross";
type MyVotes = Record<string, VoteResponse | null>;

interface VoterEntry {
  name: string;
  vote: VoteResponse;
}

interface DateSlot {
  id: string;
  date: string;
  time: string;
  votes: { circle: number; triangle: number; cross: number };
  voters?: VoterEntry[];
}

interface DraftSlot {
  date: string;       // e.g. "6월 14일 일요일"
  dateKey: string;    // e.g. "2026-06-14"
  time: string;       // e.g. "오후 2시"
}

export type DateVoteState =
  | "hostCreating"   // 호스트 날짜·시간 선택 UI
  | "guestVoting"
  | "guestVoted"
  | "hostView"
  | "resultsPublic"
  | "resultsPrivate"
  | "confirmed";

export interface DateVoteProps {
  state?: DateVoteState;
  onBack?: () => void;
}

// ── Vote constants ─────────────────────────────────────────────────────────
const VOTE_CFG = {
  circle:   { symbol: "○", label: "좋아요",   active: "bg-emerald-500 text-white border-transparent shadow-sm", passive: "bg-white text-emerald-500 border-emerald-200 hover:bg-emerald-50", bar: "bg-emerald-400", chip: "bg-emerald-50 text-emerald-700", col: "text-emerald-500" },
  triangle: { symbol: "△", label: "애매해요", active: "bg-amber-400 text-white border-transparent shadow-sm",   passive: "bg-white text-amber-500 border-amber-200 hover:bg-amber-50",   bar: "bg-amber-300",   chip: "bg-amber-50 text-amber-700",   col: "text-amber-500"   },
  cross:    { symbol: "×", label: "안 됨",    active: "bg-rose-500 text-white border-transparent shadow-sm",    passive: "bg-white text-rose-400 border-rose-200 hover:bg-rose-50",      bar: "bg-rose-300",    chip: "bg-rose-50 text-rose-700",     col: "text-rose-400"    },
} as const;

const TYPES: VoteResponse[] = ["circle", "triangle", "cross"];

// ── Calendar / time constants ──────────────────────────────────────────────
const DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

function getDayLabel(dateKey: string): string {
  const d = new Date(dateKey);
  return DAY_LABELS[d.getDay()] ?? "";
}

function formatDateLabel(dateKey: string): string {
  const d = new Date(dateKey);
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${getDayLabel(dateKey)}요일`;
}

// ── Mock data (6월 14일·15일) ───────────────────────────────────────────────
const MOCK_SLOTS: DateSlot[] = [
  { id: "s1", date: "6월 14일 일요일", time: "오후 2시",  votes: { circle: 7, triangle: 2, cross: 1 }, voters: [{ name: "김현제", vote: "circle" }, { name: "윤숙희", vote: "circle" }, { name: "최우진", vote: "triangle" }, { name: "박수훈", vote: "circle" }] },
  { id: "s2", date: "6월 14일 일요일", time: "오후 7시",  votes: { circle: 4, triangle: 5, cross: 1 }, voters: [{ name: "김현제", vote: "triangle" }, { name: "윤숙희", vote: "circle" }, { name: "최우진", vote: "triangle" }] },
  { id: "s3", date: "6월 15일 월요일", time: "오후 2시",  votes: { circle: 9, triangle: 1, cross: 0 }, voters: [{ name: "김현제", vote: "circle" }, { name: "윤숙희", vote: "circle" }, { name: "최우진", vote: "circle" }, { name: "박수훈", vote: "circle" }] },
];

const CONFIRMED_ID = "s3";
const INITIAL_VOTES: MyVotes = { s1: "circle", s2: "triangle", s3: "circle" };

const INITIAL_DRAFT: DraftSlot[] = [
  { date: "6월 14일 일요일", dateKey: "2026-06-14", time: "오후 2시" },
  { date: "6월 14일 일요일", dateKey: "2026-06-14", time: "오후 7시" },
  { date: "6월 15일 월요일", dateKey: "2026-06-15", time: "오후 2시" },
];

function groupByDate(slots: DateSlot[]) {
  const map = new Map<string, DateSlot[]>();
  for (const s of slots) {
    const arr = map.get(s.date) ?? [];
    arr.push(s);
    map.set(s.date, arr);
  }
  return map;
}

// ── Vote sub-components ────────────────────────────────────────────────────
function VoteBtn({ type, active, onClick }: { type: VoteResponse; active: boolean; onClick: () => void }) {
  const cfg = VOTE_CFG[type];
  return (
    <button type="button" onClick={onClick}
      className={cn("flex size-11 items-center justify-center rounded-full border text-[20px] font-black transition-all active:scale-90", active ? cfg.active : cfg.passive)}
    >{cfg.symbol}</button>
  );
}

function VoterChip({ voter }: { voter: VoterEntry }) {
  const cfg = VOTE_CFG[voter.vote];
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[12px] font-medium", cfg.chip)}>
      {cfg.symbol} {voter.name}
    </span>
  );
}

// ── Vote Table ─────────────────────────────────────────────────────────────
function VoteTable({ myVotes, onVote }: { myVotes: MyVotes; onVote: (id: string, t: VoteResponse) => void }) {
  const groups = groupByDate(MOCK_SLOTS);
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface">
      <div className="grid grid-cols-[1fr_52px_52px_52px] items-center gap-0 border-b-2 border-border bg-gray-50 px-4 py-3">
        <span className="text-[12px] font-bold text-text-tertiary">날짜 · 시간</span>
        {TYPES.map((t) => (
          <div key={t} className="flex flex-col items-center gap-0.5">
            <span className={cn("text-[22px] font-black leading-none", VOTE_CFG[t].col)}>{VOTE_CFG[t].symbol}</span>
            <span className="text-[10px] font-medium text-text-tertiary">{VOTE_CFG[t].label}</span>
          </div>
        ))}
      </div>
      {Array.from(groups.entries()).map(([date, slots], gi) => (
        <div key={date}>
          <div className={cn("border-b border-border bg-gray-50/60 px-4 py-2", gi > 0 && "border-t-2 border-t-gray-200")}>
            <span className="text-[12px] font-extrabold text-text-secondary">{date}</span>
          </div>
          {slots.map((slot) => {
            const total = slot.votes.circle + slot.votes.triangle + slot.votes.cross;
            const myV = myVotes[slot.id];
            return (
              <div key={slot.id}
                className={cn("grid grid-cols-[1fr_52px_52px_52px] items-center gap-0 border-b border-border px-4 py-3 last:border-0 transition-colors", myV ? "bg-gray-50/40" : "bg-white")}
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-[15px] font-bold text-text-primary">{slot.time}</span>
                  <span className="text-[11px] text-text-tertiary">응답 {total}명</span>
                </div>
                {TYPES.map((t) => (
                  <div key={t} className="flex flex-col items-center gap-1">
                    <VoteBtn type={t} active={myV === t} onClick={() => onVote(slot.id, t)} />
                    <span className={cn("text-[11px] font-semibold", myV === t ? VOTE_CFG[t].col : "text-text-tertiary")}>{slot.votes[t]}</span>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ── Result Card ────────────────────────────────────────────────────────────
function ResultCard({ slot, showNames, isConfirmed, isTop }: { slot: DateSlot; showNames: boolean; isConfirmed: boolean; isTop: boolean }) {
  const total = slot.votes.circle + slot.votes.triangle + slot.votes.cross;
  return (
    <div className={cn("rounded-2xl border p-4", isConfirmed ? "border-primary bg-primary/5 ring-2 ring-primary/20" : isTop ? "border-emerald-300 bg-emerald-50/40" : "border-border bg-surface")}>
      <div className="flex items-start justify-between gap-2">
        <div>
          {isConfirmed && <span className="text-[11px] font-extrabold uppercase tracking-widest text-primary">✓ 확정</span>}
          {isTop && !isConfirmed && <span className="text-[11px] font-bold text-emerald-600">✦ 최다 응답</span>}
          <p className="text-[15px] font-bold text-text-primary">{slot.date}</p>
          <p className="text-[13px] text-text-secondary">{slot.time}</p>
        </div>
        <span className="text-[12px] text-text-tertiary">총 {total}명</span>
      </div>
      <div className="mt-3 flex gap-3">
        {TYPES.map((t) => {
          const pct = total > 0 ? (slot.votes[t] / total) * 100 : 0;
          const cfg = VOTE_CFG[t];
          return (
            <div key={t} className="flex flex-1 flex-col items-center gap-1.5">
              <div className="flex items-baseline gap-1">
                <span className={cn("text-[18px] font-black leading-none", cfg.col)}>{cfg.symbol}</span>
                <span className="text-[13px] font-bold text-text-primary">{slot.votes[t]}</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                <div className={cn("h-full rounded-full", cfg.bar)} style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
      {showNames && slot.voters && slot.voters.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5 border-t border-border pt-3">
          {slot.voters.map((v) => <VoterChip key={`${slot.id}-${v.name}`} voter={v} />)}
        </div>
      )}
    </div>
  );
}

// ── Time Picker ────────────────────────────────────────────────────────────
function formatTimeLabel(ampm: "오전" | "오후", hour: number, minute: number): string {
  const minStr = minute === 0 ? "" : ` ${minute}분`;
  return `${ampm} ${hour}시${minStr}`;
}

interface TimePickerProps {
  onAdd: (time: string) => void;
  disabled?: boolean;
}

function TimePicker({ onAdd, disabled }: TimePickerProps) {
  const [ampm, setAmpm] = useState<"오전" | "오후">("오후");
  const [hour, setHour] = useState(2);
  const [minute, setMinute] = useState(0);
  const [sliderTarget, setSliderTarget] = useState<"hour" | "minute" | null>(null);

  const stepHour = (delta: number) => setHour((h) => ((h - 1 + delta + 12) % 12) + 1);
  const stepMinute = (delta: number) => setMinute((m) => (m + delta * 5 + 60) % 60);

  const preview = formatTimeLabel(ampm, hour, minute);

  const toggleSlider = (target: "hour" | "minute") =>
    setSliderTarget((prev) => (prev === target ? null : target));

  return (
    <div className="flex flex-col gap-2.5 rounded-2xl border border-border bg-surface p-4">

      {/* Row 1: 오전/오후 — 가로 플립 바 (높이 줄임) */}
      <button
        type="button"
        onClick={() => setAmpm((p) => (p === "오전" ? "오후" : "오전"))}
        className="flex w-full items-center overflow-hidden rounded-lg border border-border bg-gray-50"
      >
        {(["오전", "오후"] as const).map((v) => (
          <span
            key={v}
            className={cn(
              "flex flex-1 items-center justify-center py-1.5 text-[13px] font-extrabold transition-all duration-150",
              ampm === v ? "bg-primary text-white" : "text-text-tertiary",
            )}
          >{v}</span>
        ))}
      </button>

      {/* Row 2: 시 spinner + 분 spinner */}
      <div className="flex gap-2">
        {/* 시 spinner */}
        <div
          className={cn(
            "flex flex-1 cursor-pointer items-center justify-between rounded-xl border bg-white px-2 py-2 transition-colors",
            sliderTarget === "hour" ? "border-primary" : "border-border",
          )}
        >
          <button type="button" onClick={() => stepHour(-1)}
            className="flex size-7 items-center justify-center rounded-lg text-text-secondary hover:bg-gray-100">
            <Icon name="chevron-left" size="xs" color="currentColor" decorative />
          </button>
          <button type="button" onClick={() => toggleSlider("hour")}
            className="flex items-baseline gap-1 rounded-lg px-1 py-0.5 hover:bg-gray-50">
            <span className="w-7 text-center text-[20px] font-extrabold text-text-primary tabular-nums">{hour}</span>
            <span className="text-[12px] font-bold text-text-tertiary">시</span>
          </button>
          <button type="button" onClick={() => stepHour(1)}
            className="flex size-7 items-center justify-center rounded-lg text-text-secondary hover:bg-gray-100">
            <Icon name="chevron-right" size="xs" color="currentColor" decorative />
          </button>
        </div>

        {/* 분 spinner */}
        <div
          className={cn(
            "flex flex-1 cursor-pointer items-center justify-between rounded-xl border bg-white px-2 py-2 transition-colors",
            sliderTarget === "minute" ? "border-primary" : "border-border",
          )}
        >
          <button type="button" onClick={() => stepMinute(-1)}
            className="flex size-7 items-center justify-center rounded-lg text-text-secondary hover:bg-gray-100">
            <Icon name="chevron-left" size="xs" color="currentColor" decorative />
          </button>
          <button type="button" onClick={() => toggleSlider("minute")}
            className="flex items-baseline gap-1 rounded-lg px-1 py-0.5 hover:bg-gray-50">
            <span className="w-7 text-center text-[20px] font-extrabold text-text-primary tabular-nums">
              {String(minute).padStart(2, "0")}
            </span>
            <span className="text-[12px] font-bold text-text-tertiary">분</span>
          </button>
          <button type="button" onClick={() => stepMinute(1)}
            className="flex size-7 items-center justify-center rounded-lg text-text-secondary hover:bg-gray-100">
            <Icon name="chevron-right" size="xs" color="currentColor" decorative />
          </button>
        </div>
      </div>

      {/* Row 3: 드롭다운 슬라이더 */}
      {sliderTarget && (
        <div className="overflow-hidden rounded-xl border border-primary/30 bg-white shadow-md">
          {/* 드롭다운 헤더 */}
          <div className="flex items-center justify-between border-b border-border bg-primary/5 px-3 py-2">
            <span className="text-[12px] font-bold text-primary">
              {sliderTarget === "hour" ? "시간 선택" : "분 선택 (5분 단위)"}
            </span>
            <button
              type="button"
              onClick={() => setSliderTarget(null)}
              className="text-[11px] font-semibold text-text-tertiary hover:text-text-secondary"
            >닫기</button>
          </div>

          {/* 스크롤 가능한 항목 리스트 */}
          <div className="max-h-48 overflow-y-auto overscroll-contain">
            {(sliderTarget === "hour"
              ? [1,2,3,4,5,6,7,8,9,10,11,12]
              : [0,5,10,15,20,25,30,35,40,45,50,55]
            ).map((val) => {
              const isSelected = sliderTarget === "hour" ? hour === val : minute === val;
              const label = sliderTarget === "hour" ? `${val}시` : `${String(val).padStart(2,"0")}분`;
              return (
                <button
                  key={val}
                  type="button"
                  onClick={() => {
                    if (sliderTarget === "hour") setHour(val); else setMinute(val);
                    setSliderTarget(null);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between px-4 py-3 text-left transition-colors",
                    isSelected
                      ? "bg-primary/10 font-extrabold text-primary"
                      : "text-text-primary hover:bg-gray-50",
                  )}
                >
                  <span className="text-[15px]">{label}</span>
                  {isSelected && (
                    <span className="text-[13px] font-bold text-primary">✓</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Add button */}
      <Button
        fullWidth
        variant="outline"
        size="md"
        disabled={disabled}
        onClick={() => onAdd(preview)}
        className="gap-2"
      >
        <Icon name="plus" size="xs" color="currentColor" decorative />
        <span className="font-bold text-primary">{preview}</span> 추가
      </Button>
    </div>
  );
}

// ── Calendar ───────────────────────────────────────────────────────────────
function CalendarPicker({
  year, month,
  selectedDates, onToggleDate,
  onPrevMonth, onNextMonth,
}: {
  year: number; month: number;
  selectedDates: Set<string>;
  onToggleDate: (key: string) => void;
  onPrevMonth: () => void; onNextMonth: () => void;
}) {
  const firstDay = new Date(year, month - 1, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month, 0).getDate();
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      {/* Month nav */}
      <div className="mb-3 flex items-center justify-between">
        <button type="button" onClick={onPrevMonth} className="flex size-8 items-center justify-center rounded-full hover:bg-gray-100">
          <Icon name="chevron-left" size="sm" color="inactive" decorative />
        </button>
        <span className="text-[15px] font-bold text-text-primary">{year}년 {month}월</span>
        <button type="button" onClick={onNextMonth} className="flex size-8 items-center justify-center rounded-full hover:bg-gray-100">
          <Icon name="chevron-right" size="sm" color="inactive" decorative />
        </button>
      </div>

      {/* Day headers */}
      <div className="mb-1 grid grid-cols-7">
        {DAY_LABELS.map((d, i) => (
          <span key={d} className={cn("text-center text-[12px] font-bold", i === 0 ? "text-rose-400" : i === 6 ? "text-blue-400" : "text-text-tertiary")}>{d}</span>
        ))}
      </div>

      {/* Date cells */}
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((day, i) => {
          if (!day) return <span key={`e-${i}`} />;
          const key = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const isPast = key < todayKey;
          const isSelected = selectedDates.has(key);
          const dow = i % 7;
          return (
            <button
              key={key}
              type="button"
              disabled={isPast}
              onClick={() => onToggleDate(key)}
              className={cn(
                "mx-auto flex size-9 items-center justify-center rounded-full text-[14px] font-semibold transition-all",
                isPast ? "text-gray-300 cursor-not-allowed" :
                isSelected ? "bg-primary text-white shadow-sm" :
                dow === 0 ? "text-rose-400 hover:bg-rose-50" :
                dow === 6 ? "text-blue-400 hover:bg-blue-50" :
                "text-text-primary hover:bg-gray-100",
              )}
            >{day}</button>
          );
        })}
      </div>
    </div>
  );
}

// ── Host Creating View ─────────────────────────────────────────────────────
function HostCreatingView({ onBack }: { onBack?: () => void }) {
  const now = new Date();
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth() + 1);
  const [selectedDates, setSelectedDates] = useState<Set<string>>(
    new Set(["2026-06-14", "2026-06-15"]),
  );
  const [focusedDate, setFocusedDate] = useState<string | null>("2026-06-14");
  const [slots, setSlots] = useState<DraftSlot[]>(INITIAL_DRAFT);
  const [isPublic, setIsPublic] = useState(true);
  const [step, setStep] = useState<"date" | "settings">("date");

  const toggleDate = (key: string) => {
    setSelectedDates((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
        setSlots((s) => s.filter((sl) => sl.dateKey !== key));
        if (focusedDate === key) setFocusedDate(null);
      } else {
        next.add(key);
        setFocusedDate(key);
      }
      return next;
    });
  };

  const addTime = (time: string) => {
    if (!focusedDate) return;
    if (slots.length >= 30) return;
    if (slots.some((s) => s.dateKey === focusedDate && s.time === time)) return;
    const label = formatDateLabel(focusedDate);
    setSlots((prev) => [...prev, { date: label, dateKey: focusedDate, time }]);
  };

  const removeSlot = (idx: number) => setSlots((prev) => prev.filter((_, i) => i !== idx));

  const prevMonth = () => {
    if (calMonth === 1) { setCalYear(y => y - 1); setCalMonth(12); }
    else setCalMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (calMonth === 12) { setCalYear(y => y + 1); setCalMonth(1); }
    else setCalMonth(m => m + 1);
  };

  // Slots grouped for display
  const slotsByDate = new Map<string, DraftSlot[]>();
  for (const s of slots) {
    const arr = slotsByDate.get(s.dateKey) ?? [];
    arr.push(s);
    slotsByDate.set(s.dateKey, arr);
  }

  const focusedTimes = focusedDate ? (slotsByDate.get(focusedDate) ?? []).map(s => s.time) : [];

  if (step === "settings") {
    return (
      <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col overflow-x-hidden bg-background">
        <TopAppBar className="shrink-0" title="투표 설정" onBack={() => setStep("date")} />
        <main className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 pb-6 pt-4">
          {/* Summary */}
          <div className="rounded-2xl border border-border bg-surface p-4">
            <p className="mb-2 text-[13px] font-bold text-text-primary">선택된 후보 ({slots.length}개)</p>
            <div className="flex flex-col gap-1">
              {Array.from(slotsByDate.entries()).map(([, daySlots]) =>
                daySlots.map((s, i) => (
                  <div key={`${s.dateKey}-${s.time}`} className="flex items-center justify-between">
                    <span className="text-[13px] text-text-secondary">
                      {i === 0 ? s.date : ""} {s.time}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Deadline */}
          <div className="rounded-2xl border border-border bg-surface p-4">
            <p className="mb-3 text-[13px] font-bold text-text-primary">투표 마감 시간</p>
            {["행사 1일 전 오후 11:59", "행사 3일 전 오후 11:59", "행사 7일 전 오후 11:59", "직접 설정"].map((label) => (
              <label key={label} className="flex cursor-pointer items-center gap-3 py-2">
                <div className="flex size-5 items-center justify-center rounded-full border-2 border-primary bg-primary">
                  <div className="size-2 rounded-full bg-white" />
                </div>
                <span className="text-[14px] text-text-primary">{label}</span>
              </label>
            ))}
          </div>

          {/* Public/private */}
          <div className="rounded-2xl border border-border bg-surface p-4">
            <p className="mb-3 text-[13px] font-bold text-text-primary">투표자 공개 설정</p>
            <div className="flex gap-3">
              {[{ v: true, label: "공개", desc: "누가 어떤 응답인지 표시" }, { v: false, label: "비공개", desc: "통계만 표시, 이름 숨김" }].map(({ v, label, desc }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setIsPublic(v)}
                  className={cn(
                    "flex flex-1 flex-col gap-0.5 rounded-2xl border p-3 text-left transition-all",
                    isPublic === v ? "border-primary bg-primary/5" : "border-border",
                  )}
                >
                  <span className={cn("text-[14px] font-bold", isPublic === v ? "text-primary" : "text-text-primary")}>{label}</span>
                  <span className="text-[11px] text-text-secondary">{desc}</span>
                </button>
              ))}
            </div>
          </div>
        </main>
        <div className="relative z-10 shrink-0">
          <StickyCTA primary={{ label: "투표 만들기", onClick: () => {} }} />
        </div>
        <MainBottomNav activeKey="invitations" />
      </div>
    );
  }

  return (
    <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col overflow-x-hidden bg-background">
      <TopAppBar className="shrink-0" title="날짜 투표 만들기" onBack={onBack ?? (() => {})} />

      <main className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 pb-6 pt-4">
        {/* Step indicator */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-white">1</span>
            <span className="text-[13px] font-bold text-primary">날짜·시간 선택</span>
          </div>
          <Icon name="chevron-right" size="xs" color="inactive" decorative />
          <div className="flex items-center gap-1.5">
            <span className="flex size-5 items-center justify-center rounded-full bg-gray-200 text-[11px] font-bold text-gray-500">2</span>
            <span className="text-[13px] text-text-tertiary">투표 설정</span>
          </div>
        </div>

        {/* Calendar */}
        <CalendarPicker
          year={calYear} month={calMonth}
          selectedDates={selectedDates}
          onToggleDate={toggleDate}
          onPrevMonth={prevMonth}
          onNextMonth={nextMonth}
        />

        {/* Date tab strip – tap to focus */}
        {selectedDates.size > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-0.5">
            {Array.from(selectedDates).sort().map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setFocusedDate(key)}
                className={cn(
                  "shrink-0 rounded-full border px-3 py-1.5 text-[13px] font-semibold transition-all",
                  focusedDate === key
                    ? "border-primary bg-primary text-white"
                    : "border-border bg-surface text-text-secondary",
                )}
              >
                {new Date(key).getMonth() + 1}월 {new Date(key).getDate()}일
              </button>
            ))}
          </div>
        )}

        {/* Time picker for focused date */}
        {focusedDate && (
          <div className="flex flex-col gap-2">
            <p className="px-1 text-[13px] font-bold text-text-secondary">
              {formatDateLabel(focusedDate)} — 시간 추가
            </p>
            <TimePicker
              disabled={slots.length >= 30}
              onAdd={(time) => addTime(time)}
            />
          </div>
        )}

        {/* Added slots list */}
        {slots.length > 0 && (
          <div className="rounded-2xl border border-border bg-surface p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[13px] font-bold text-text-primary">추가된 후보 ({slots.length} / 30)</p>
            </div>
            <div className="flex flex-col divide-y divide-border">
              {Array.from(slotsByDate.entries()).sort().map(([, daySlots]) =>
                daySlots.map((s) => (
                  <div key={`${s.dateKey}-${s.time}`} className="flex items-center justify-between py-2.5">
                    <div>
                      <p className="text-[13px] font-semibold text-text-primary">{s.date}</p>
                      <p className="text-[12px] text-text-secondary">{s.time}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeSlot(slots.indexOf(s))}
                      aria-label="삭제"
                      className="flex size-7 items-center justify-center rounded-full text-text-tertiary hover:bg-gray-100"
                    >
                      <Icon name="x" size="xs" color="currentColor" decorative />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>

      <div className="relative z-10 shrink-0">
        <StickyCTA
          primary={{
            label: slots.length > 0 ? `다음 — ${slots.length}개 후보 선택됨` : "날짜·시간을 선택해주세요",
            onClick: () => { if (slots.length > 0) setStep("settings"); },
            disabled: slots.length === 0,
          }}
        />
      </div>
      <MainBottomNav activeKey="invitations" />
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export const DateVote = ({ state = "guestVoting", onBack }: DateVoteProps) => {
  const [myVotes, setMyVotes] = useState<MyVotes>(
    state === "guestVoted" || state === "hostView" ? INITIAL_VOTES : {},
  );
  const [closeConfirmOpen, setCloseConfirmOpen] = useState(false);

  if (state === "hostCreating") return <HostCreatingView onBack={onBack} />;

  const handleVote = (id: string, type: VoteResponse) =>
    setMyVotes((prev) => ({ ...prev, [id]: prev[id] === type ? null : type }));

  const canVote = state === "guestVoting" || state === "guestVoted" || state === "hostView";
  const isClosed = state === "resultsPublic" || state === "resultsPrivate" || state === "confirmed";
  const showNames = state === "resultsPublic";
  const isConfirmedView = state === "confirmed";

  const topSlot = [...MOCK_SLOTS].sort((a, b) => b.votes.circle - a.votes.circle)[0];

  return (
    <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col overflow-x-hidden bg-background">
      <TopAppBar className="shrink-0" title="날짜 투표" onBack={onBack ?? (() => {})} />

      <main className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 pb-6 pt-4">
        {/* 초대장 정보 */}
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-3.5">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Icon name="ticket" size="md" color="primary" decorative />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14px] font-bold text-text-primary">와라의 생일 파티</p>
            <p className="text-[12px] text-text-tertiary">호스트 · 김와라</p>
          </div>
          <Badge variant="noResponse" size="sm" className="ml-auto shrink-0">날짜 미정</Badge>
        </div>

        {/* 상태 배너 */}
        {!isClosed ? (
          <div className="flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
            <Icon name="clock" size="sm" color="currentColor" decorative className="shrink-0 text-amber-500" />
            <span className="text-[13px] font-medium text-amber-700">투표 마감 2시간 30분 전 · 6월 10일 오후 11:59</span>
          </div>
        ) : isConfirmedView ? (
          <div className="flex items-center gap-3 rounded-2xl border border-primary bg-primary/5 px-4 py-3">
            <Icon name="check-circle" size="md" color="primary" decorative className="shrink-0" />
            <div>
              <p className="text-[13px] font-bold text-primary">날짜가 확정됐어요!</p>
              <p className="text-[12px] text-text-secondary">6월 15일 월요일 오후 2시</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-2xl border border-border bg-surface px-4 py-3">
            <Icon name="lock" size="sm" color="inactive" decorative className="shrink-0" />
            <p className="text-[13px] text-text-secondary">투표가 마감되었어요 · 최종 결과</p>
          </div>
        )}

        {/* 호스트 관리 패널 */}
        {state === "hostView" && (
          <div className="rounded-2xl border border-border bg-surface p-4">
            <p className="mb-2.5 text-[13px] font-bold text-text-primary">호스트 관리</p>
            <div className="flex items-center gap-2 text-[13px] text-text-secondary">
              <Icon name="users" size="sm" color="inactive" decorative />
              미투표자 2명 · <span className="font-medium text-text-primary">박수훈, 이지은</span>
            </div>
            <div className="mt-2.5 flex gap-2">
              <Button variant="outline" size="sm" className="flex-1 gap-1.5">
                <Icon name="bell" size="xs" color="currentColor" decorative />리마인더 발송
              </Button>
              <Button variant="outline" size="sm"
                className="flex-1 gap-1.5 border-rose-200 text-rose-500 hover:bg-rose-50"
                onClick={() => setCloseConfirmOpen(true)}
              >
                <Icon name="lock" size="xs" color="currentColor" decorative />투표 조기 종료
              </Button>
            </div>
          </div>
        )}

        {/* 참여 현황 */}
        <div className="flex items-center justify-between rounded-2xl border border-border bg-surface px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {["김", "윤", "최", "박"].map((initial, i) => (
                <Avatar key={i} size="xs" initial={initial} className="ring-2 ring-surface" />
              ))}
            </div>
            <span className="text-[13px] text-text-secondary">
              <span className="font-bold text-text-primary">10명</span> 중{" "}
              <span className="font-bold text-text-primary">8명</span> 참여
            </span>
          </div>
          <span className="text-[12px] text-text-tertiary">미투표 2명</span>
        </div>

        {canVote && (
          <>
            <VoteTable myVotes={myVotes} onVote={handleVote} />
            <p className="text-center text-[12px] text-text-tertiary">같은 날짜의 여러 시간대에 동시에 응답할 수 있어요</p>
          </>
        )}

        {isClosed && (
          <div className="flex flex-col gap-3">
            {MOCK_SLOTS.map((slot) => (
              <ResultCard key={slot.id} slot={slot} showNames={showNames}
                isConfirmed={isConfirmedView && slot.id === CONFIRMED_ID}
                isTop={topSlot?.id === slot.id && !isConfirmedView}
              />
            ))}
          </div>
        )}
      </main>

      {canVote && (
        <div className="relative z-10 shrink-0">
          <StickyCTA primary={{ label: state === "guestVoted" || state === "hostView" ? "응답 수정하기" : "투표 제출하기", onClick: () => {} }} />
        </div>
      )}

      <MainBottomNav activeKey="invitations" />

      <ConfirmModal contained open={closeConfirmOpen} onOpenChange={setCloseConfirmOpen}
        title="투표를 지금 종료할까요?"
        description="마감 전이지만 결과를 바로 처리할 수 있어요"
        confirmLabel="종료하기" confirmVariant="danger"
      />
    </div>
  );
};
