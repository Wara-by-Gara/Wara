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

export type DateVoteState =
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

// ── Constants ──────────────────────────────────────────────────────────────
const VOTE_CFG = {
  circle:   { symbol: "○", label: "좋아요",   active: "bg-emerald-500 text-white border-transparent shadow-sm", passive: "bg-white text-emerald-500 border-emerald-200 hover:bg-emerald-50", bar: "bg-emerald-400", chip: "bg-emerald-50 text-emerald-700", col: "text-emerald-500" },
  triangle: { symbol: "△", label: "애매해요", active: "bg-amber-400 text-white border-transparent shadow-sm",   passive: "bg-white text-amber-500 border-amber-200 hover:bg-amber-50",   bar: "bg-amber-300",   chip: "bg-amber-50 text-amber-700",   col: "text-amber-500"   },
  cross:    { symbol: "×", label: "안 됨",    active: "bg-rose-500 text-white border-transparent shadow-sm",    passive: "bg-white text-rose-400 border-rose-200 hover:bg-rose-50",      bar: "bg-rose-300",    chip: "bg-rose-50 text-rose-700",     col: "text-rose-400"    },
} as const;

const TYPES: VoteResponse[] = ["circle", "triangle", "cross"];

// ── Mock Data ──────────────────────────────────────────────────────────────
const MOCK_SLOTS: DateSlot[] = [
  { id: "s1", date: "6월 14일 토요일", time: "오후 2시",  votes: { circle: 8, triangle: 3, cross: 1 }, voters: [{ name: "김현제", vote: "circle" }, { name: "윤숙희", vote: "circle" }, { name: "최우진", vote: "triangle" }, { name: "박수훈", vote: "circle" }, { name: "이지은", vote: "cross" }] },
  { id: "s2", date: "6월 14일 토요일", time: "오후 7시",  votes: { circle: 5, triangle: 5, cross: 2 }, voters: [{ name: "김현제", vote: "triangle" }, { name: "윤숙희", vote: "circle" }, { name: "최우진", vote: "cross" }, { name: "박수훈", vote: "circle" }] },
  { id: "s3", date: "6월 21일 토요일", time: "오후 2시",  votes: { circle: 10, triangle: 2, cross: 0 }, voters: [{ name: "김현제", vote: "circle" }, { name: "윤숙희", vote: "circle" }, { name: "최우진", vote: "circle" }, { name: "박수훈", vote: "circle" }, { name: "이지은", vote: "triangle" }] },
  { id: "s4", date: "6월 21일 토요일", time: "오후 7시",  votes: { circle: 3, triangle: 4, cross: 5 }, voters: [{ name: "김현제", vote: "cross" }, { name: "윤숙희", vote: "triangle" }, { name: "최우진", vote: "cross" }] },
  { id: "s5", date: "6월 28일 토요일", time: "오후 6시",  votes: { circle: 6, triangle: 3, cross: 3 }, voters: [{ name: "김현제", vote: "circle" }, { name: "윤숙희", vote: "circle" }, { name: "최우진", vote: "triangle" }, { name: "박수훈", vote: "circle" }] },
];

const CONFIRMED_ID = "s3";
const INITIAL_VOTES: MyVotes = { s1: "circle", s2: "triangle", s3: "circle", s4: null, s5: "circle" };

function groupByDate(slots: DateSlot[]) {
  const map = new Map<string, DateSlot[]>();
  for (const s of slots) {
    const arr = map.get(s.date) ?? [];
    arr.push(s);
    map.set(s.date, arr);
  }
  return map;
}

// ── Sub-components ─────────────────────────────────────────────────────────
function VoteBtn({ type, active, onClick }: { type: VoteResponse; active: boolean; onClick: () => void }) {
  const cfg = VOTE_CFG[type];
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex size-11 items-center justify-center rounded-full border text-[20px] font-black transition-all active:scale-90",
        active ? cfg.active : cfg.passive,
      )}
    >
      {cfg.symbol}
    </button>
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

// ── Vote Table (canVote 모드) ──────────────────────────────────────────────
function VoteTable({ myVotes, onVote }: { myVotes: MyVotes; onVote: (id: string, t: VoteResponse) => void }) {
  const groups = groupByDate(MOCK_SLOTS);
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface">
      {/* Column headers */}
      <div className="grid grid-cols-[1fr_52px_52px_52px] items-center gap-0 border-b-2 border-border bg-gray-50 px-4 py-3">
        <span className="text-[12px] font-bold text-text-tertiary">날짜 · 시간</span>
        {TYPES.map((t) => (
          <div key={t} className="flex flex-col items-center gap-0.5">
            <span className={cn("text-[22px] font-black leading-none", VOTE_CFG[t].col)}>{VOTE_CFG[t].symbol}</span>
            <span className="text-[10px] font-medium text-text-tertiary">{VOTE_CFG[t].label}</span>
          </div>
        ))}
      </div>

      {/* Date groups */}
      {Array.from(groups.entries()).map(([date, slots], gi) => (
        <div key={date}>
          {/* Date group label */}
          <div className={cn("border-b border-border bg-gray-50/60 px-4 py-2", gi > 0 && "border-t-2 border-t-gray-200")}>
            <span className="text-[12px] font-extrabold text-text-secondary">{date}</span>
          </div>

          {/* Time rows */}
          {slots.map((slot) => {
            const total = slot.votes.circle + slot.votes.triangle + slot.votes.cross;
            const myV = myVotes[slot.id];
            return (
              <div
                key={slot.id}
                className={cn(
                  "grid grid-cols-[1fr_52px_52px_52px] items-center gap-0 border-b border-border px-4 py-3 last:border-0 transition-colors",
                  myV ? "bg-gray-50/40" : "bg-white",
                )}
              >
                {/* Time + count */}
                <div className="flex flex-col gap-0.5">
                  <span className="text-[15px] font-bold text-text-primary">{slot.time}</span>
                  <span className="text-[11px] text-text-tertiary">응답 {total}명</span>
                </div>
                {/* Vote buttons */}
                {TYPES.map((t) => (
                  <div key={t} className="flex flex-col items-center gap-1">
                    <VoteBtn type={t} active={myV === t} onClick={() => onVote(slot.id, t)} />
                    <span className={cn("text-[11px] font-semibold", myV === t ? VOTE_CFG[t].col : "text-text-tertiary")}>
                      {slot.votes[t]}
                    </span>
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

// ── Result Card (results / confirmed 모드) ────────────────────────────────
function ResultCard({ slot, showNames, isConfirmed, isTop }: { slot: DateSlot; showNames: boolean; isConfirmed: boolean; isTop: boolean }) {
  const total = slot.votes.circle + slot.votes.triangle + slot.votes.cross;
  return (
    <div className={cn(
      "rounded-2xl border p-4",
      isConfirmed ? "border-primary bg-primary/5 ring-2 ring-primary/20" :
      isTop       ? "border-emerald-300 bg-emerald-50/40" :
                    "border-border bg-surface",
    )}>
      <div className="flex items-start justify-between gap-2">
        <div>
          {isConfirmed && <span className="text-[11px] font-extrabold uppercase tracking-widest text-primary">✓ 확정</span>}
          {isTop && !isConfirmed && <span className="text-[11px] font-bold text-emerald-600">✦ 최다 응답</span>}
          <p className="text-[15px] font-bold text-text-primary">{slot.date}</p>
          <p className="text-[13px] text-text-secondary">{slot.time}</p>
        </div>
        <span className="text-[12px] text-text-tertiary">총 {total}명</span>
      </div>

      {/* Stats row */}
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

      {/* Voter names (public) */}
      {showNames && slot.voters && slot.voters.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5 border-t border-border pt-3">
          {slot.voters.map((v) => <VoterChip key={`${slot.id}-${v.name}`} voter={v} />)}
        </div>
      )}
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────
export const DateVote = ({ state = "guestVoting", onBack }: DateVoteProps) => {
  const [myVotes, setMyVotes] = useState<MyVotes>(
    state === "guestVoted" || state === "hostView" ? INITIAL_VOTES : {},
  );
  const [closeConfirmOpen, setCloseConfirmOpen] = useState(false);

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
              <p className="text-[12px] text-text-secondary">6월 21일 토요일 오후 2시</p>
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
              미투표자 2명 ·&nbsp;
              <span className="font-medium text-text-primary">박수훈, 이지은</span>
            </div>
            <div className="mt-2.5 flex gap-2">
              <Button variant="outline" size="sm" className="flex-1 gap-1.5">
                <Icon name="bell" size="xs" color="currentColor" decorative />
                리마인더 발송
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 gap-1.5 border-rose-200 text-rose-500 hover:bg-rose-50"
                onClick={() => setCloseConfirmOpen(true)}
              >
                <Icon name="lock" size="xs" color="currentColor" decorative />
                투표 조기 종료
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

        {/* ── 투표 테이블 (canVote) ── */}
        {canVote && (
          <>
            <VoteTable myVotes={myVotes} onVote={handleVote} />
            <p className="text-center text-[12px] text-text-tertiary">
              같은 날짜의 여러 시간대에 동시에 응답할 수 있어요
            </p>
          </>
        )}

        {/* ── 결과 카드 (closed / confirmed) ── */}
        {isClosed && (
          <div className="flex flex-col gap-3">
            {MOCK_SLOTS.map((slot) => (
              <ResultCard
                key={slot.id}
                slot={slot}
                showNames={showNames}
                isConfirmed={isConfirmedView && slot.id === CONFIRMED_ID}
                isTop={topSlot?.id === slot.id && !isConfirmedView}
              />
            ))}
          </div>
        )}
      </main>

      {canVote && (
        <div className="relative z-10 shrink-0">
          <StickyCTA
            primary={{
              label: state === "guestVoted" || state === "hostView" ? "응답 수정하기" : "투표 제출하기",
              onClick: () => {},
            }}
          />
        </div>
      )}

      <MainBottomNav activeKey="invitations" />

      <ConfirmModal
        contained
        open={closeConfirmOpen}
        onOpenChange={setCloseConfirmOpen}
        title="투표를 지금 종료할까요?"
        description="마감 전이지만 결과를 바로 처리할 수 있어요"
        confirmLabel="종료하기"
        confirmVariant="danger"
      />
    </div>
  );
};
