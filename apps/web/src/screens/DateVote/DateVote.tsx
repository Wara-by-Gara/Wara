"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Icon, Button, Avatar, TopAppBar, ConfirmDialog } from "@wara/ui";
import { MonthCalendar } from "@/components/domain";
import { StickyCTA } from "@/components/layout/StickyCTA";
import { cn } from "@/lib/cn";
import { ROUTES } from "@/constants/routes";
import { usePoll, useCreatePoll, useVoteResults, useSubmitResponses, useClosePoll, useConfirmSlot } from "@/hooks/useDateVote";
import { useMyParticipant, useParticipants } from "@/hooks/useParticipants";
import { useInvitation } from "@/hooks/useInvitations";
import type { DateVotePoll, DateVoteResponse, SlotResult } from "@/lib/api/dateVote";

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
  time: string;       // e.g. "오후 2시" (표시용)
  timeKey: string;    // e.g. "14:00" (API용)
}

export interface VoteDraft {
  slots: { date: string; startTime: string; sortOrder: number }[];
  isAnonymous: boolean;
  closesAt?: string; // undefined = 마감 없음
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
  invitationId?: string;  // 실제 페이지에서 사용 (API 연결)
  state?: DateVoteState;  // Storybook override (invitationId 없을 때 폴백)
  onBack?: () => void;
}

// ── API ↔ 컴포넌트 응답값 매핑 ───────────────────────────────────────────────
export const RESPONSE_RMAP: Record<'good' | 'maybe' | 'bad', VoteResponse> = {
  good: 'circle',
  maybe: 'triangle',
  bad: 'cross',
};

const RESPONSE_MAP: Record<VoteResponse, 'good' | 'maybe' | 'bad'> = {
  circle: 'good',
  triangle: 'maybe',
  cross: 'bad',
};

export function formatApiTime(hhmm: string): string {
  const [hStr, mStr] = hhmm.split(':');
  const h = Number(hStr);
  const m = Number(mStr ?? '0');
  const ampm = h < 12 ? '오전' : '오후';
  const hour = h === 0 ? 12 : h > 12 ? h - 12 : h;
  const minStr = m === 0 ? '' : ` ${m}분`;
  return `${ampm} ${hour}시${minStr}`;
}

function deriveVoteState(
  poll: DateVotePoll | null,
  myResponses: DateVoteResponse[],
  memberRole: 'HOST' | 'GUEST',
): DateVoteState {
  if (!poll) return memberRole === 'HOST' ? 'hostCreating' : 'guestVoting';
  if (poll.status === 'confirmed') return 'confirmed';
  if (poll.status === 'closed') return poll.isAnonymous ? 'resultsPrivate' : 'resultsPublic';
  if (memberRole === 'HOST') return 'hostView';
  if (myResponses.length > 0) return 'guestVoted';
  return 'guestVoting';
}

function slotResultToDateSlot(sr: SlotResult): DateSlot {
  return {
    id: sr.slot.id,
    date: formatDateLabel(sr.slot.date),
    time: sr.slot.startTime ? formatApiTime(sr.slot.startTime) : '시간 미정',
    votes: { circle: sr.counts.good, triangle: sr.counts.maybe, cross: sr.counts.bad },
    voters: sr.voters?.map((v) => ({
      name: v.displayName ?? '익명',
      vote: RESPONSE_RMAP[v.response],
    })),
  };
}

// ── Vote constants ─────────────────────────────────────────────────────────
const VOTE_CFG = {
  circle:   { symbol: "👍", label: "좋아요",   active: "bg-emerald-500 text-white border-transparent shadow-sm", passive: "bg-surface text-emerald-500 border-emerald-200 hover:bg-gray-50 transition-colors duration-150", bar: "bg-emerald-400", chip: "bg-emerald-50 text-emerald-700", col: "text-emerald-500" },
  triangle: { symbol: "🤔", label: "애매해요", active: "bg-amber-400 text-white border-transparent shadow-sm",   passive: "bg-surface text-amber-500 border-amber-200 hover:bg-gray-50 transition-colors duration-150",   bar: "bg-amber-300",   chip: "bg-amber-50 text-amber-700",   col: "text-amber-500"   },
  cross:    { symbol: "👎", label: "안 됨",    active: "bg-rose-500 text-white border-transparent shadow-sm",    passive: "bg-surface text-rose-400 border-rose-200 hover:bg-gray-50 transition-colors duration-150",      bar: "bg-rose-300",    chip: "bg-rose-50 text-rose-700",     col: "text-rose-400"    },
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

function toHHMM(ampm: "오전" | "오후", hour: number, minute: number): string {
  let h = hour;
  if (ampm === "오후" && hour !== 12) h = hour + 12;
  if (ampm === "오전" && hour === 12) h = 0;
  return `${String(h).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

// ── Mock data (6월 14일·15일) ───────────────────────────────────────────────
const MOCK_SLOTS: DateSlot[] = [
  { id: "s1", date: "6월 14일 일요일", time: "오후 2시",  votes: { circle: 7, triangle: 2, cross: 1 }, voters: [{ name: "김현제", vote: "circle" }, { name: "윤숙희", vote: "circle" }, { name: "최우진", vote: "triangle" }, { name: "박수훈", vote: "circle" }] },
  { id: "s2", date: "6월 14일 일요일", time: "오후 7시",  votes: { circle: 4, triangle: 5, cross: 1 }, voters: [{ name: "김현제", vote: "triangle" }, { name: "윤숙희", vote: "circle" }, { name: "최우진", vote: "triangle" }] },
  { id: "s3", date: "6월 15일 월요일", time: "오후 2시",  votes: { circle: 9, triangle: 1, cross: 0 }, voters: [{ name: "김현제", vote: "circle" }, { name: "윤숙희", vote: "circle" }, { name: "최우진", vote: "circle" }, { name: "박수훈", vote: "circle" }] },
];

const INITIAL_VOTES: MyVotes = { s1: "circle", s2: "triangle", s3: "circle" };

const INITIAL_DRAFT: DraftSlot[] = [
  { date: "6월 14일 일요일", dateKey: "2026-06-14", time: "오후 2시",  timeKey: "14:00" },
  { date: "6월 14일 일요일", dateKey: "2026-06-14", time: "오후 7시",  timeKey: "19:00" },
  { date: "6월 15일 월요일", dateKey: "2026-06-15", time: "오후 2시",  timeKey: "14:00" },
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
      className={cn("flex size-11 items-center justify-center rounded-full border text-[20px] font-black transition-colors", active ? cfg.active : cfg.passive)}
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
function VoteTable({ slots, myVotes, onVote, topSlotIds, showVoters }: {
  slots: DateSlot[];
  myVotes: MyVotes;
  onVote: (id: string, t: VoteResponse) => void;
  topSlotIds?: Set<string>;
  showVoters?: boolean;
}) {
  const groups = groupByDate(slots);
  return (
    <div className="overflow-hidden rounded-md border border-border bg-surface">
      <div className="grid grid-cols-[1fr_52px_52px_52px] items-center gap-0 border-b-2 border-border bg-surface-muted px-4 py-3">
        <span className="text-[12px] font-bold text-text-disabled">날짜 · 시간</span>
        {TYPES.map((t) => (
          <div key={t} className="flex flex-col items-center gap-0.5">
            <span className={cn("text-[22px] font-black leading-none", VOTE_CFG[t].col)}>{VOTE_CFG[t].symbol}</span>
            <span className="text-[10px] font-medium text-text-disabled">{VOTE_CFG[t].label}</span>
          </div>
        ))}
      </div>
      {Array.from(groups.entries()).map(([date, slots], gi) => (
        <div key={date}>
          <div className={cn("border-b border-border bg-surface-muted px-4 py-2", gi > 0 && "border-t-2 border-t-border")}>
            <span className="text-[12px] font-extrabold text-text-muted">{date}</span>
          </div>
          {slots.map((slot) => {
            const total = slot.votes.circle + slot.votes.triangle + slot.votes.cross;
            const myV = myVotes[slot.id];
            const isTop = topSlotIds?.has(slot.id) ?? false;
            return (
              <div key={slot.id} className={cn("border-b border-border last:border-0 transition-colors", isTop ? "bg-emerald-50/40" : myV ? "bg-surface-muted" : "bg-surface")}>
                <div className="grid grid-cols-[1fr_52px_52px_52px] items-center gap-0 px-4 py-3">
                  <div className="flex flex-col gap-0.5">
                    {isTop && <span className="text-[10px] font-bold text-emerald-600">✦ 현재 최다</span>}
                    <span className={cn("text-[15px] font-bold", isTop ? "text-emerald-700" : "text-text")}>{slot.time}</span>
                    <span className={cn("text-[11px]", isTop ? "text-emerald-700/80" : "text-text-disabled")}>응답 {total}명</span>
                  </div>
                  {TYPES.map((t) => (
                    <div key={t} className="flex flex-col items-center gap-1">
                      <VoteBtn type={t} active={myV === t} onClick={() => onVote(slot.id, t)} />
                      <span className={cn("text-[11px] font-semibold", myV === t ? VOTE_CFG[t].col : "text-text-disabled")}>{slot.votes[t]}</span>
                    </div>
                  ))}
                </div>
                {showVoters && slot.voters && slot.voters.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 border-t border-border px-4 pb-3 pt-2">
                    {slot.voters.map((v) => <VoterChip key={`${slot.id}-${v.name}`} voter={v} />)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ── Result Card ────────────────────────────────────────────────────────────
function ResultCard({ slot, showNames, isConfirmed, isTop, onConfirm }: { slot: DateSlot; showNames: boolean; isConfirmed: boolean; isTop: boolean; onConfirm?: () => void }) {
  const total = slot.votes.circle + slot.votes.triangle + slot.votes.cross;
  return (
    <div className={cn("rounded-md border p-4", isConfirmed ? "border-primary bg-primary/5 ring-2 ring-primary/20" : isTop ? "border-emerald-300 bg-emerald-50/40" : "border-border bg-surface")}>
      <div className="flex items-start justify-between gap-2">
        <div>
          {isConfirmed && <span className="text-[11px] font-extrabold uppercase tracking-widest text-primary">✓ 확정</span>}
          {isTop && !isConfirmed && <span className="text-[11px] font-bold text-emerald-600">✦ 최다 응답</span>}
          <p className="text-[15px] font-bold text-text">{slot.date}</p>
          <p className="text-[13px] text-text-muted">{slot.time}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="text-[12px] text-text-disabled">총 {total}명</span>
          {onConfirm && (
            <button
              type="button"
              onClick={onConfirm}
              className="rounded-full border border-primary px-3 py-1 text-[12px] font-semibold text-primary hover:bg-gray-50 transition-colors duration-150"
            >
              이 날짜로 확정
            </button>
          )}
        </div>
      </div>
      <div className="mt-3 flex gap-3">
        {TYPES.map((t) => {
          const pct = total > 0 ? (slot.votes[t] / total) * 100 : 0;
          const cfg = VOTE_CFG[t];
          return (
            <div key={t} className="flex flex-1 flex-col items-center gap-1.5">
              <div className="flex items-baseline gap-1">
                <span className={cn("text-[18px] font-black leading-none", cfg.col)}>{cfg.symbol}</span>
                <span className="text-[13px] font-bold text-text">{slot.votes[t]}</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
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
  onAdd: (display: string, hhmm: string) => void;
  disabled?: boolean;
}

// ── Wheel Picker ────────────────────────────────────────────────────────────
const ITEM_H = 44;
const VISIBLE = 5;

function WheelColumn({
  items,
  value,
  onChange,
}: {
  items: number[];
  value: number;
  onChange: (v: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isScrolling = useRef(false);
  const scrollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedIdx = items.indexOf(value);

  // 선택값 → 스크롤 위치 동기화 (외부 변경 시에만)
  const scrollToIndex = useCallback((idx: number, smooth = true) => {
    if (!ref.current) return;
    ref.current.scrollTo({ top: idx * ITEM_H, behavior: smooth ? "smooth" : "instant" });
  }, []);

  useEffect(() => {
    if (!isScrolling.current) scrollToIndex(selectedIdx, false);
  }, [selectedIdx, scrollToIndex]);

  const handleScroll = () => {
    if (!ref.current) return;
    isScrolling.current = true;
    if (scrollTimer.current) clearTimeout(scrollTimer.current);
    scrollTimer.current = setTimeout(() => {
      if (!ref.current) return;
      const idx = Math.round(ref.current.scrollTop / ITEM_H);
      const clamped = Math.max(0, Math.min(idx, items.length - 1));
      isScrolling.current = false;
      if (items[clamped] !== undefined && items[clamped] !== value) onChange(items[clamped]!);
      // snap
      ref.current.scrollTo({ top: clamped * ITEM_H, behavior: "smooth" });
    }, 120);
  };

  return (
    <div className="relative flex flex-1 flex-col items-center" style={{ height: ITEM_H * VISIBLE }}>
      {/* 선택 영역 하이라이트 */}
      <div
        className="pointer-events-none absolute inset-x-0 rounded-sm bg-primary/10"
        style={{ top: ITEM_H * 2, height: ITEM_H }}
      />
      {/* 위 페이드 */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 bg-gradient-to-b from-white/90 to-transparent" style={{ height: ITEM_H * 2 }} />
      {/* 아래 페이드 */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-white/90 to-transparent" style={{ height: ITEM_H * 2 }} />

      {/* 스크롤 컨테이너 */}
      <div
        ref={ref}
        onScroll={handleScroll}
        className="w-full overflow-y-scroll overscroll-contain"
        style={{
          height: ITEM_H * VISIBLE,
          scrollSnapType: "y mandatory",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {/* 상단 패딩 */}
        <div style={{ height: ITEM_H * 2 }} />
        {items.map((item, i) => {
          const dist = Math.abs(i - selectedIdx);
          return (
            <div
              key={item}
              style={{ height: ITEM_H, scrollSnapAlign: "center" }}
              className="flex cursor-pointer items-center justify-center"
              onClick={() => {
                onChange(item);
                scrollToIndex(i);
              }}
            >
              <span
                className={cn(
                  "tabular-nums transition-all duration-150",
                  dist === 0
                    ? "text-[20px] font-extrabold text-primary"
                    : dist === 1
                      ? "text-[16px] font-semibold text-text-muted opacity-60"
                      : "text-[14px] font-medium text-text-disabled opacity-30",
                )}
              >
                {item}
              </span>
            </div>
          );
        })}
        {/* 하단 패딩 */}
        <div style={{ height: ITEM_H * 2 }} />
      </div>

    </div>
  );
}

// ── TimePicker ───────────────────────────────────────────────────────────────
function TimePicker({ onAdd, disabled }: TimePickerProps) {
  const [ampm, setAmpm] = useState<"오전" | "오후">("오후");
  const [hour, setHour] = useState(2);
  const [minute, setMinute] = useState(0);

  const HOURS = [1,2,3,4,5,6,7,8,9,10,11,12];
  const MINUTES = [0,10,20,30,40,50];

  const preview = formatTimeLabel(ampm, hour, minute);

  return (
    <div className="flex flex-col gap-2.5 rounded-md border border-border bg-surface p-4">

      {/* 오전/오후 플립 바 */}
      <button
        type="button"
        onClick={() => setAmpm((p) => (p === "오전" ? "오후" : "오전"))}
        className="flex w-full items-center overflow-hidden rounded-xs border border-border bg-surface-muted"
      >
        {(["오전", "오후"] as const).map((v) => (
          <span
            key={v}
            className={cn(
              "flex flex-1 items-center justify-center py-1.5 text-[13px] font-extrabold transition-all duration-150",
              ampm === v ? "bg-primary text-white" : "text-text-disabled",
            )}
          >{v}</span>
        ))}
      </button>

      {/* 시 · 분 휠 */}
      <div className="flex items-center gap-0 rounded-sm border border-border bg-surface-muted px-2" style={{ height: 120, overflow: "hidden" }}>
        <WheelColumn items={HOURS} value={hour} onChange={setHour} />
        <div className="text-[20px] font-extrabold text-text-disabled">:</div>
        <WheelColumn items={MINUTES} value={minute} onChange={setMinute} />
      </div>

      {/* 추가 버튼 */}
      <Button
        fullWidth
        variant="secondary"
        size="md"
        disabled={disabled}
        onClick={() => onAdd(preview, toHHMM(ampm, hour, minute))}
        className="gap-2"
      >
        <Icon name="plus" size="xs" color="currentColor" decorative />
        <span className="font-bold text-primary">{preview}</span> 추가
      </Button>
    </div>
  );
}

// ── Host Creating View ─────────────────────────────────────────────────────
export function HostCreatingView({ onBack, invitationId, onDraftComplete, initialDraft }: {
  onBack?: () => void;
  invitationId?: string;
  onDraftComplete?: (draft: VoteDraft) => void;
  initialDraft?: VoteDraft;
}) {
  const now = new Date();
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth() + 1);
  const isDraftMode = !!onDraftComplete;

  const restoredSlots: DraftSlot[] = initialDraft
    ? initialDraft.slots.map((s) => ({
        date: formatDateLabel(s.date),
        dateKey: s.date,
        time: formatApiTime(s.startTime),
        timeKey: s.startTime,
      }))
    : [];

  // Storybook 폴백: 실제 페이지(invitationId 존재) / Create 모달(onDraftComplete 존재) / 복원(initialDraft) 모두 아닐 때만 mock 사용
  const useMockDefaults = !invitationId && !isDraftMode && !initialDraft;

  const [selectedDates, setSelectedDates] = useState<Set<string>>(
    initialDraft ? new Set(initialDraft.slots.map((s) => s.date))
    : useMockDefaults ? new Set(["2026-06-14", "2026-06-15"])
    : new Set(),
  );
  const [focusedDate, setFocusedDate] = useState<string | null>(
    initialDraft ? (initialDraft.slots[0]?.date ?? null)
    : useMockDefaults ? "2026-06-14"
    : null,
  );
  const [slots, setSlots] = useState<DraftSlot[]>(
    initialDraft ? restoredSlots
    : useMockDefaults ? INITIAL_DRAFT
    : [],
  );
  const [isPublic, setIsPublic] = useState(initialDraft ? !initialDraft.isAnonymous : true);
  const [step, setStep] = useState<"date" | "settings">("date");
  const createPollMutation = useCreatePoll(invitationId ?? '');

  // 투표 마감 옵션
  const [deadlineMode, setDeadlineMode] = useState<"none" | "custom">("none");
  const [customDeadlineDate, setCustomDeadlineDate] = useState("");
  const [customDeadlineTime, setCustomDeadlineTime] = useState(() => {
    const n = new Date();
    return `${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}`;
  });
  const closesAt = deadlineMode === "custom" && customDeadlineDate
    ? new Date(`${customDeadlineDate}T${customDeadlineTime}:00`).toISOString()
    : undefined;
  const todayStr = new Date().toISOString().slice(0, 10);

  const toggleDate = (key: string) => {
    setSelectedDates((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
        setSlots((s) => s.filter((sl) => sl.dateKey !== key));
        if (focusedDate === key) setFocusedDate(null);
      } else {
        // 슬롯 없는 기존 선택 날짜 제거
        for (const d of next) {
          if (!slots.some((s) => s.dateKey === d)) next.delete(d);
        }
        next.add(key);
        setFocusedDate(key);
      }
      return next;
    });
  };

  const [slotLimitMsg, setSlotLimitMsg] = useState(false);

  const addTime = (time: string, hhmm: string) => {
    if (!focusedDate) return;
    if (slots.length >= 30) {
      setSlotLimitMsg(true);
      setTimeout(() => setSlotLimitMsg(false), 2500);
      return;
    }
    if (slots.some((s) => s.dateKey === focusedDate && s.time === time)) return;
    const label = formatDateLabel(focusedDate);
    setSlots((prev) => [...prev, { date: label, dateKey: focusedDate, time, timeKey: hhmm }]);
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

  if (step === "settings") {
    return (
      <div className="relative mx-auto flex h-full min-h-dvh w-full max-w-md flex-col overflow-x-hidden bg-background lg:max-w-none">
        <TopAppBar className="shrink-0" title="투표 설정" onBack={() => setStep("date")} />
        <main className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-page pb-6 pt-4 lg:mx-auto lg:w-full lg:max-w-5xl">
          {/* Summary */}
          <div className="rounded-md border border-border bg-surface p-4">
            <p className="mb-2 text-[13px] font-bold text-text">선택된 후보 ({slots.length}개)</p>
            <div className="flex flex-col gap-1">
              {Array.from(slotsByDate.entries()).map(([, daySlots]) =>
                daySlots.map((s) => (
                  <div key={`${s.dateKey}-${s.time}`} className="flex items-center gap-2">
                    <span className="w-5 text-[12px] font-bold text-text-disabled">{slots.indexOf(s) + 1}.</span>
                    <span className="text-[13px] text-text-muted">{s.date} {s.time}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Deadline */}
          <div className="rounded-md border border-border bg-surface p-4">
            <p className="mb-3 text-[13px] font-bold text-text">투표 마감 시간</p>
            <div className="flex gap-3">
              {([
                { mode: "none" as const, label: "없음", desc: "마감일 없이 진행" },
                { mode: "custom" as const, label: "직접 설정", desc: "날짜·시간 직접 지정" },
              ]).map(({ mode, label, desc }) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setDeadlineMode(mode)}
                  className={cn(
                    "flex flex-1 flex-col gap-0.5 rounded-md border p-3 text-left transition-all",
                    deadlineMode === mode ? "border-primary bg-primary/5" : "border-border",
                  )}
                >
                  <span className={cn("text-[14px] font-bold", deadlineMode === mode ? "text-primary" : "text-text")}>{label}</span>
                  <span className="text-[11px] text-text-muted">{desc}</span>
                </button>
              ))}
            </div>
            {deadlineMode === "custom" && (
              <div className="mt-3 flex gap-2 rounded-sm border border-border bg-surface-muted p-3">
                <input
                  type="date"
                  value={customDeadlineDate}
                  min={todayStr}
                  onChange={(e) => setCustomDeadlineDate(e.target.value)}
                  className="flex-1 rounded-xs border border-border bg-surface px-3 py-2 text-[13px]"
                />
                <input
                  type="time"
                  value={customDeadlineTime}
                  onChange={(e) => setCustomDeadlineTime(e.target.value)}
                  className="w-28 rounded-xs border border-border bg-surface px-3 py-2 text-[13px]"
                />
              </div>
            )}
          </div>

          {/* Public/private */}
          <div className="rounded-md border border-border bg-surface p-4">
            <p className="mb-3 text-[13px] font-bold text-text">투표자 공개 설정</p>
            <div className="flex gap-3">
              {[{ v: true, label: "공개", desc: "누가 어떤 응답인지 표시" }, { v: false, label: "비공개", desc: "통계만 표시, 이름 숨김" }].map(({ v, label, desc }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setIsPublic(v)}
                  className={cn(
                    "flex flex-1 flex-col gap-0.5 rounded-md border p-3 text-left transition-all",
                    isPublic === v ? "border-primary bg-primary/5" : "border-border",
                  )}
                >
                  <span className={cn("text-[14px] font-bold", isPublic === v ? "text-primary" : "text-text")}>{label}</span>
                  <span className="text-[11px] text-text-muted">{desc}</span>
                </button>
              ))}
            </div>
          </div>
        </main>
        <div className="relative z-10 shrink-0">
          <StickyCTA primary={{
            label: onDraftComplete ? "완료" : (createPollMutation.isPending ? "생성 중..." : "투표 만들기"),
            disabled: (!onDraftComplete && createPollMutation.isPending)
              || slots.length === 0
              || (deadlineMode === "custom" && !customDeadlineDate),
            onClick: () => {
              const slotsData = slots.map((s, i) => ({
                date: s.dateKey,
                startTime: s.timeKey,
                sortOrder: i,
              }));
              if (onDraftComplete) {
                onDraftComplete({ closesAt, isAnonymous: !isPublic, slots: slotsData });
                return;
              }
              if (!invitationId) return;
              createPollMutation.mutate({ closesAt, isAnonymous: !isPublic, slots: slotsData });
            },
          }} />
        </div>
      </div>
    );
  }

  return (
    <div className="relative mx-auto flex h-full min-h-dvh w-full max-w-md flex-col overflow-x-hidden bg-background lg:max-w-none">
      <TopAppBar className="shrink-0" title="일정 투표 만들기" onBack={onBack ?? (() => {})} />

      <main className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-page pb-6 pt-4 lg:mx-auto lg:w-full lg:max-w-5xl">
        {/* Step indicator */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-white">1</span>
            <span className="text-[13px] font-bold text-primary">날짜·시간 선택</span>
          </div>
          <Icon name="chevron-right" size="xs" color="inactive" decorative />
          <div className="flex items-center gap-1.5">
            <span className="flex size-5 items-center justify-center rounded-full bg-gray-200 text-[11px] font-bold text-gray-500">2</span>
            <span className="text-[13px] text-text-disabled">투표 설정</span>
          </div>
        </div>

        {/* Calendar */}
        <MonthCalendar
          year={calYear} month={calMonth}
          selectedKeys={selectedDates}
          onDayClick={toggleDate}
          onPrevMonth={prevMonth}
          onNextMonth={nextMonth}
          disablePast
        />

        {/* Date tab strip – 슬롯이 있는 날짜만 표시 */}
        {slots.length > 0 && (() => {
          const datesWithSlots = Array.from(new Set(slots.map((s) => s.dateKey))).sort();
          return datesWithSlots.length > 0 ? (
            <div className="flex gap-2 overflow-x-auto pb-0.5">
              {datesWithSlots.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFocusedDate(key)}
                  className={cn(
                    "shrink-0 rounded-full border px-3 py-1.5 text-[13px] font-semibold transition-all",
                    focusedDate === key
                      ? "border-primary bg-primary text-white"
                      : "border-border bg-surface text-text-muted",
                  )}
                >
                  {new Date(key).getMonth() + 1}월 {new Date(key).getDate()}일
                </button>
              ))}
            </div>
          ) : null;
        })()}

        {/* Time picker for focused date */}
        {focusedDate && (
          <div className="flex flex-col gap-2">
            <p className="px-1 text-[13px] font-bold text-text-muted">
              {formatDateLabel(focusedDate)} — 시간 추가
            </p>
            <TimePicker
              disabled={slots.length >= 30}
              onAdd={(time, hhmm) => addTime(time, hhmm)}
            />
          </div>
        )}

        {/* 30개 초과 메시지 */}
        {slotLimitMsg && (
          <div className="rounded-sm bg-rose-50 px-4 py-2.5 text-[13px] font-medium text-rose-600">
            후보는 최대 30개까지 추가할 수 있어요
          </div>
        )}

        {/* Added slots list */}
        {slots.length > 0 && (
          <div className="overflow-hidden rounded-md border border-border bg-surface">
            <div className="sticky top-0 z-10 bg-surface px-4 pb-2 pt-4">
              <p className="text-[13px] font-bold text-text">추가된 후보 ({slots.length}개)</p>
              {slots.length >= 30 && (
                <p className="mt-1 text-[12px] text-rose-500">30개 이상은 추가할 수 없습니다.</p>
              )}
            </div>
            <div style={{ maxHeight: 300, overflowY: 'auto' }} className="px-4 pb-4">
            <div className="flex flex-col divide-y divide-border">
              {Array.from(slotsByDate.entries()).sort().map(([, daySlots]) =>
                daySlots.map((s) => (
                  <div key={`${s.dateKey}-${s.time}`} className="flex items-center justify-between py-2.5">
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 text-[12px] font-bold text-text-disabled">{slots.indexOf(s) + 1}.</span>
                      <div>
                        <p className="text-[13px] font-semibold text-text">{s.date}</p>
                        <p className="text-[12px] text-text-muted">{s.time}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeSlot(slots.indexOf(s))}
                      aria-label="삭제"
                      className="flex size-7 items-center justify-center rounded-full text-text-disabled hover:bg-gray-50 transition-colors duration-150"
                    >
                      <Icon name="x" size="xs" color="currentColor" decorative />
                    </button>
                  </div>
                ))
              )}
            </div>
            </div>{/* scroll container */}
          </div>
        )}
      </main>

      <div className="relative z-10 shrink-0">
        <StickyCTA
          primary={{
            label: slots.length >= 2 ? `다음 — ${slots.length}개 후보 선택됨` : slots.length === 1 ? "후보를 1개 이상 더 추가해주세요" : "날짜·시간을 선택해주세요",
            onClick: () => { if (slots.length >= 2) setStep("settings"); },
            disabled: slots.length < 2,
          }}
        />
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export const DateVote = ({ invitationId, state: stateProp, onBack }: DateVoteProps) => {
  const router = useRouter();
  const goBack = onBack ?? (() => {
    if (invitationId) {
      if (window.history.length > 1) router.back();
      else router.push(ROUTES.INVITATIONS.DETAIL(invitationId));
    } else {
      router.back();
    }
  });

  const enabled = !!invitationId;
  const { data: invitation } = useInvitation(invitationId ?? '');
  const { data: pollData } = usePoll(invitationId ?? '', { enabled });
  const hasPoll = !!pollData?.poll;
  const { data: resultsData } = useVoteResults(invitationId ?? '', { enabled: enabled && hasPoll });
  const { data: myParticipant } = useMyParticipant(invitationId ?? '', { enabled });
  const { data: participantsData } = useParticipants(invitationId ?? '');
  const submitMutation = useSubmitResponses(invitationId ?? '');
  const closePollMutation = useClosePoll(invitationId ?? '');
  const confirmSlotMutation = useConfirmSlot(invitationId ?? '');

  const poll = pollData?.poll ?? null;
  const myResponses = pollData?.myResponses ?? [];
  const memberRole = myParticipant?.memberRole ?? 'GUEST';

  const state: DateVoteState = invitationId
    ? deriveVoteState(poll, myResponses, memberRole)
    : (stateProp ?? 'guestVoting');

  // 실 슬롯: voteResults에서 변환 (counts 포함), 없으면 poll slots에서 빈 카운트로
  const realSlots: DateSlot[] = resultsData?.slotResults
    ? resultsData.slotResults.map(slotResultToDateSlot)
    : (pollData?.slots ?? []).map((s) => ({
        id: s.id,
        date: formatDateLabel(s.date),
        time: s.startTime ? formatApiTime(s.startTime) : '시간 미정',
        votes: { circle: 0, triangle: 0, cross: 0 },
      }));

  const displaySlots = invitationId ? realSlots : MOCK_SLOTS;

  const initialVotes: MyVotes = Object.fromEntries(
    myResponses.map((r) => [r.slotId, RESPONSE_RMAP[r.response]])
  );
  const [myVotes, setMyVotes] = useState<MyVotes>(
    invitationId
      ? initialVotes
      : stateProp === "guestVoted" || stateProp === "hostView"
        ? INITIAL_VOTES
        : {},
  );

  useEffect(() => {
    if (invitationId && myResponses.length > 0) {
      setMyVotes(Object.fromEntries(myResponses.map((r) => [r.slotId, RESPONSE_RMAP[r.response]])));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pollData]);

  const [closeConfirmOpen, setCloseConfirmOpen] = useState(false);
  const [confirmSlotId, setConfirmSlotId] = useState<string | null>(null);

  if (state === "hostCreating") return <HostCreatingView invitationId={invitationId} onBack={goBack} />;

  const handleVote = (id: string, type: VoteResponse) => {
    const nextMyVotes = { ...myVotes, [id]: myVotes[id] === type ? null : type };
    setMyVotes(nextMyVotes);
    if (!invitationId) return;
    const responses = Object.entries(nextMyVotes)
      .filter((entry): entry is [string, VoteResponse] => entry[1] !== null)
      .map(([slotId, v]) => ({ slotId, response: RESPONSE_MAP[v] }));
    submitMutation.mutate(responses);
  };

  const canVote = state === "guestVoting" || state === "guestVoted" || state === "hostView";
  const isClosed = state === "resultsPublic" || state === "resultsPrivate" || state === "confirmed";
  const showNames = state === "resultsPublic" || (state === "confirmed" && !poll?.isAnonymous);
  const isConfirmedView = state === "confirmed";

  // 현재 최다: 좋아요(good) 최다 슬롯 "1개"만. 동점이면 안 됨(bad) 적은 순 → 먼저 나온 슬롯 순으로
  // 단일 결정해 배지가 여러 슬롯에 중복으로 뜨지 않게 한다.
  const topSlotId = displaySlots.reduce<DateSlot | null>((best, s) => {
    if (s.votes.circle === 0) return best;
    if (!best) return s;
    if (s.votes.circle !== best.votes.circle) return s.votes.circle > best.votes.circle ? s : best;
    if (s.votes.cross !== best.votes.cross) return s.votes.cross < best.votes.cross ? s : best;
    return best; // 완전 동률이면 먼저 나온 슬롯 유지
  }, null)?.id ?? null;
  const topSlotIds = topSlotId ? new Set([topSlotId]) : new Set<string>();

  // 마감 시간 표시 — 서버는 "마감 없음"을 2099-12-31로 저장 (date-vote.service.ts:52)
  const isNoDeadline = poll?.closesAt && new Date(poll.closesAt).getFullYear() >= 2099;
  const deadlineText = (() => {
    if (!poll?.closesAt || isNoDeadline) return null;
    return new Date(poll.closesAt).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  })();

  // 확정 슬롯
  const confirmedSlot = poll?.confirmedSlotId
    ? displaySlots.find((s) => s.id === poll.confirmedSlotId)
    : null;

  // 참여 현황
  const allParticipants = participantsData?.participants ?? [];
  const totalCount = participantsData?.summary.totalCount ?? 0;
  const totalVoters = resultsData?.voterCount ?? 0;
  const nonVoterCount = Math.max(0, totalCount - totalVoters);

  return (
    <div className="relative mx-auto flex h-full min-h-dvh w-full max-w-md flex-col overflow-x-hidden bg-background lg:max-w-none">
      <TopAppBar className="shrink-0 lg:hidden" title="일정 투표" onBack={goBack} />

      <main className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-page pb-6 pt-4 lg:mx-auto lg:w-full lg:max-w-5xl lg:grid lg:grid-cols-[340px_minmax(0,1fr)] lg:items-start lg:gap-x-6 lg:pt-8">
        {/* 좌측: 정보·상태·참여현황 (데스크톱 고정) */}
        <div className="flex flex-col gap-4 lg:sticky lg:top-2 lg:self-start">
        {/* 초대장 정보 */}
        {invitationId && invitation && (
          <button
            type="button"
            onClick={() => router.push(ROUTES.INVITATIONS.DETAIL(invitationId))}
            aria-label={`${invitation.title} 초대장으로 이동`}
            className="flex w-full items-center gap-3 rounded-md border border-border bg-surface p-3.5 text-left transition-colors hover:bg-surface-muted active:bg-surface-muted"
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-sm bg-primary/10">
              <Icon name="ticket" size="md" color="primary" decorative />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-bold text-text">{invitation.title}</p>
              <p className="text-[12px] text-text-disabled">
                호스트 · {invitation.host?.name ?? invitation.host?.nickname ?? '알 수 없음'}
              </p>
            </div>
            <Icon name="chevron-right" size="sm" color="inactive" decorative className="shrink-0" />
          </button>
        )}

        {/* 상태 배너 */}
        {!isClosed ? (
          deadlineText ? (
            <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-4 py-3">
              <Icon name="clock" size="sm" color="currentColor" decorative className="shrink-0 text-amber-500" />
              <span className="text-[13px] font-medium text-amber-700">투표 마감 · {deadlineText}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-md border border-border bg-surface px-4 py-3">
              <Icon name="calendar" size="sm" color="inactive" decorative className="shrink-0" />
              <span className="text-[13px] text-text-muted">투표 진행 중 · 마감일 없음</span>
            </div>
          )
        ) : isConfirmedView ? (
          <div className="flex items-center gap-3 rounded-md border border-primary bg-primary/5 px-4 py-3">
            <Icon name="check-circle" size="md" color="primary" decorative className="shrink-0" />
            <div>
              <p className="text-[13px] font-bold text-primary">날짜가 확정됐어요!</p>
              {confirmedSlot && (
                <p className="text-[12px] text-text-muted">{confirmedSlot.date} {confirmedSlot.time}</p>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-md border border-border bg-surface px-4 py-3">
            <Icon name="lock" size="sm" color="inactive" decorative className="shrink-0" />
            <p className="text-[13px] text-text-muted">투표가 마감되었어요 · 최종 결과</p>
          </div>
        )}

        {/* 호스트 관리 패널 */}
        {state === "hostView" && (
          <div className="rounded-md border border-border bg-surface p-4">
            <p className="mb-2.5 text-[13px] font-bold text-text">호스트 관리</p>
            <div className="mt-2.5 flex gap-2">
              <Button variant="secondary" size="sm"
                className="flex-1 gap-1.5 border-rose-200 text-rose-500"
                disabled={closePollMutation.isPending}
                onClick={() => setCloseConfirmOpen(true)}
              >
                <Icon name="lock" size="xs" color="currentColor" decorative />
                {closePollMutation.isPending ? "처리 중..." : "투표 조기 종료"}
              </Button>
            </div>
          </div>
        )}

        {/* 참여 현황 */}
        {invitationId ? (
          totalCount > 0 && (
            <div className="flex items-center justify-between rounded-md border border-border bg-surface px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {allParticipants.slice(0, 4).map(({ participant, user }) => (
                    <Avatar
                      key={participant.id}
                      size="xs"
                      src={user.profileImageUrl ?? undefined}
                      alt={user.name ?? user.nickname ?? undefined}
                      name={user.name ?? user.nickname ?? undefined}
                      className="ring-2 ring-surface"
                    />
                  ))}
                </div>
                <span className="text-[13px] text-text-muted">
                  <span className="font-bold text-text">{totalCount}명</span> 중{" "}
                  <span className="font-bold text-text">{totalVoters}명</span> 참여
                </span>
              </div>
              {nonVoterCount > 0 && (
                <span className="text-[12px] text-text-disabled">미투표 {nonVoterCount}명</span>
              )}
            </div>
          )
        ) : (
          <div className="flex items-center justify-between rounded-md border border-border bg-surface px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {["김", "윤", "최", "박"].map((initial, i) => (
                  <Avatar key={i} size="xs" name={initial} className="ring-2 ring-surface" />
                ))}
              </div>
              <span className="text-[13px] text-text-muted">
                <span className="font-bold text-text">10명</span> 중{" "}
                <span className="font-bold text-text">8명</span> 참여
              </span>
            </div>
            <span className="text-[12px] text-text-disabled">미투표 2명</span>
          </div>
        )}
        </div>

        {/* 우측: 투표/결과 (데스크톱 스크롤) */}
        <div className="flex flex-col gap-4">
        {canVote && (
          <>
            <VoteTable
              slots={displaySlots}
              myVotes={myVotes}
              onVote={handleVote}
              topSlotIds={topSlotIds}
              showVoters={!poll?.isAnonymous}
            />
            <p className="text-center text-[12px] text-text-disabled">
              {submitMutation.isPending
                ? "저장 중..."
                : "응답이 자동 저장됩니다 · 같은 날짜의 여러 시간대에 동시에 응답할 수 있어요"}
            </p>
          </>
        )}

        {isClosed && (
          <div className="flex flex-col gap-3">
            {displaySlots.map((slot) => (
              <ResultCard key={slot.id} slot={slot} showNames={showNames}
                isConfirmed={isConfirmedView && slot.id === poll?.confirmedSlotId}
                isTop={topSlotIds.has(slot.id) && !isConfirmedView}
                onConfirm={memberRole === 'HOST' && !isConfirmedView && invitationId
                  ? () => setConfirmSlotId(slot.id)
                  : undefined}
              />
            ))}
          </div>
        )}
        </div>
      </main>

      <ConfirmDialog open={closeConfirmOpen} onOpenChange={setCloseConfirmOpen}
        title="투표를 지금 종료할까요?"
        description="마감 전이지만 결과를 바로 처리할 수 있어요"
        confirmLabel="종료하기" tone="danger"
        onConfirm={() => { closePollMutation.mutate(); setCloseConfirmOpen(false); }}
      />

      <ConfirmDialog open={!!confirmSlotId} onOpenChange={(o) => { if (!o) setConfirmSlotId(null); }}
        title="이 날짜로 확정할까요?"
        description={(() => {
          const slot = displaySlots.find((s) => s.id === confirmSlotId);
          return slot ? `${slot.date} ${slot.time}` : '';
        })()}
        confirmLabel={confirmSlotMutation.isPending ? "확정 중..." : "확정하기"}
        onConfirm={() => {
          if (!confirmSlotId) return;
          confirmSlotMutation.mutate(confirmSlotId, {
            onSuccess: () => setConfirmSlotId(null),
          });
        }}
      />

    </div>
  );
};
