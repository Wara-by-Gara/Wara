"use client";

import { Icon } from "@/components/icons";
import { Button } from "@/components/primitives/Button";
import { BottomSheet, BottomSheetContent } from "@/components/molecules/BottomSheet";
import { DateTimeSelector } from "@/components/molecules/DateTimeSelector";
import type { VoteDraft } from "@/screens/DateVote/DateVote";

export interface DateTimeSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: string;
  time: string;
  dateUnknown: boolean;
  timeUnknown: boolean;
  dateError?: boolean;
  timeError?: boolean;
  onDateChange: (v: string) => void;
  onTimeChange: (v: string) => void;
  onDateUnknownChange: (v: boolean) => void;
  onTimeUnknownChange: (v: boolean) => void;
  voteDraft: VoteDraft | null;
  onVoteSetup: () => void;
}

export function DateTimeSheet({
  open,
  onOpenChange,
  date,
  time,
  dateUnknown,
  timeUnknown,
  dateError,
  timeError,
  onDateChange,
  onTimeChange,
  onDateUnknownChange,
  onTimeUnknownChange,
  voteDraft,
  onVoteSetup,
}: DateTimeSheetProps) {
  return (
    <BottomSheet open={open} onOpenChange={onOpenChange}>
      <BottomSheetContent title="모임 날짜·시간">
        <div className="flex flex-col gap-4 pt-1">
          <DateTimeSelector
            mode="date"
            label="모임 날짜"
            value={date}
            onChange={onDateChange}
            unknownToggle
            unknown={dateUnknown}
            onUnknownChange={onDateUnknownChange}
            error={dateError ? "날짜를 선택해주세요" : undefined}
          />
          {!dateUnknown && (
            <DateTimeSelector
              mode="time"
              label="시작 시간"
              value={time}
              onChange={onTimeChange}
              unknownToggle
              unknown={timeUnknown}
              onUnknownChange={onTimeUnknownChange}
              error={timeError ? "시간을 선택해주세요" : undefined}
            />
          )}

          {/* 날짜 미정 → 투표 제안 */}
          {dateUnknown && (
            <div className="flex flex-col gap-3 rounded-md border border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10 p-4">
              <div className="flex items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-sm bg-primary/15">
                  <Icon name="calendar" size="md" color="primary" decorative />
                </div>
                <div className="flex flex-col gap-0.5">
                  <p className="text-[15px] font-bold text-text-primary">날짜 투표로 정해볼까요?</p>
                  <p className="text-[13px] leading-relaxed text-text-secondary">
                    여러 후보 날짜를 제시하고<br />참여자들이 가능한 날을 투표해요
                  </p>
                </div>
              </div>
              {voteDraft ? (
                <div className="flex items-center justify-between rounded-sm bg-white/80 px-3 py-2.5">
                  <span className="text-[13px] font-semibold text-primary">✓ 투표 후보 {voteDraft.slots.length}개 설정됨</span>
                  <button type="button" onClick={onVoteSetup} className="text-[12px] text-text-tertiary underline">
                    수정
                  </button>
                </div>
              ) : (
                <Button variant="primary" size="md" fullWidth onClick={onVoteSetup} className="mt-1">
                  날짜 투표 만들기
                </Button>
              )}
            </div>
          )}

          <Button variant="primary" size="lg" fullWidth onClick={() => onOpenChange(false)}>
            완료
          </Button>
        </div>
      </BottomSheetContent>
    </BottomSheet>
  );
}
