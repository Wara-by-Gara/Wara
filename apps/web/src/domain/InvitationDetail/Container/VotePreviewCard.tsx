"use client";

import { Icon } from "@/components/icons";
import type { GetPollResponse, GetResultsResponse } from "@/lib/api/dateVote";
import { formatApiTime } from "@/screens/DateVote/DateVote";

interface Props {
  pollData: GetPollResponse | null | undefined;
  resultsData: GetResultsResponse | null | undefined;
  isHost: boolean;
  onClick: () => void;
}

export function VotePreviewCard({ pollData, resultsData, isHost, onClick }: Props) {
  const poll = pollData?.poll ?? null;
  const slotCount = pollData?.slots.length ?? 0;
  const isConfirmed = poll?.status === 'confirmed';

  // 확정 슬롯
  const confirmedSlotResult = isConfirmed && poll?.confirmedSlotId
    ? resultsData?.slotResults.find((sr) => sr.slot.id === poll.confirmedSlotId)
    : null;

  // 동률 포함 최다 득표 슬롯 계산 (미확정일 때)
  const rankedSlots = resultsData?.slotResults
    .filter((sr) => sr.counts.good > 0)
    .sort((a, b) => b.counts.good - a.counts.good) ?? [];
  const maxGood = rankedSlots[0]?.counts.good ?? 0;
  const topResults = maxGood > 0 ? rankedSlots.filter((sr) => sr.counts.good === maxGood) : [];

  const topLabel = (() => {
    if (topResults.length === 0) return null;
    if (topResults.length === 1) {
      const d = new Date(topResults[0]!.slot.date);
      const dateStr = `${d.getMonth() + 1}월 ${d.getDate()}일`;
      const timeStr = topResults[0]!.slot.startTime ? ` ${formatApiTime(topResults[0]!.slot.startTime)}` : "";
      return `현재 1위: ${dateStr}${timeStr} (${maxGood}표)`;
    }
    return `${topResults.length}개 동률 (${maxGood}표)`;
  })();

  const subtitle = (() => {
    if (!poll) return isHost ? "투표를 만들어 날짜를 정해보세요" : "아직 투표가 없어요";
    if (isConfirmed) {
      if (confirmedSlotResult) {
        const d = new Date(confirmedSlotResult.slot.date);
        const dateStr = `${d.getMonth() + 1}월 ${d.getDate()}일`;
        const timeStr = confirmedSlotResult.slot.startTime ? ` ${formatApiTime(confirmedSlotResult.slot.startTime)}` : "";
        return `✓ ${dateStr}${timeStr} 확정 · 투표 결과 보기`;
      }
      return "✓ 날짜 확정 · 투표 결과 보기";
    }
    const parts: string[] = [];
    if (slotCount > 0) parts.push(`후보 ${slotCount}개`);
    if (topLabel) parts.push(topLabel);
    return parts.join(" · ") || "진행 중";
  })();

  return (
    <button
      type="button"
      onClick={onClick}
      className={
        isConfirmed
          ? "flex w-full items-center gap-3 rounded-md border border-border bg-surface p-4 text-left"
          : "flex w-full items-center gap-3 rounded-md border border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10 p-4 text-left"
      }
    >
      <div className={
        isConfirmed
          ? "flex size-10 shrink-0 items-center justify-center rounded-sm bg-surface-muted"
          : "flex size-10 shrink-0 items-center justify-center rounded-sm bg-primary/15"
      }>
        <Icon name="calendar" size="md" color={isConfirmed ? "inactive" : "primary"} decorative />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-bold text-text">일정 투표</p>
        <p className="truncate text-[12px] text-text-muted">{subtitle}</p>
      </div>
      <Icon name="chevron-right" size="sm" color="inactive" decorative />
    </button>
  );
}
