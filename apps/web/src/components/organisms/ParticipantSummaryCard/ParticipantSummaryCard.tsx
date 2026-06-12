'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/cn';

export interface ParticipantSummary {
  total: number;
  attending: number;
  maybe: number;
  declined: number;
  noResponse?: number;
  capacity?: number;
}

export interface ParticipantSummaryCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 카드 모드 */
  variant?: 'host' | 'guest' | 'compact';
  /** 통계 수치 */
  summary: ParticipantSummary;
  /** 커스텀 RSVP 라벨 */
  rsvpLabels?: { attending?: string; maybe?: string; declined?: string };
  isDarkBg?: boolean;
}

const Stat = ({
  label,
  value,
  color,
  isDarkBg,
}: {
  label: string;
  value: number;
  color: string;
  isDarkBg?: boolean;
}) => (
  <div className="flex flex-1 flex-col items-center gap-0.5">
    <span className={cn('text-[20px] font-bold', color)}>{value}</span>
    <span className={cn('text-[12px]', isDarkBg ? 'text-white/70' : 'text-text-tertiary')}>{label}</span>
  </div>
);

export const ParticipantSummaryCard = forwardRef<
  HTMLDivElement,
  ParticipantSummaryCardProps
>(function ParticipantSummaryCard(
  {
    className,
    variant = 'guest',
    summary,
    rsvpLabels,
    isDarkBg = false,
    ...props
  },
  ref,
) {
  const showCapacity = variant === 'host' && summary.capacity !== undefined;
  const attendingLabel = rsvpLabels?.attending ?? '참석';
  const maybeLabel = rsvpLabels?.maybe ?? '미정';
  const declinedLabel = rsvpLabels?.declined ?? '불참';

  return (
    <div ref={ref} className={cn('flex flex-col gap-3', className)} {...props}>
      <div className="flex items-baseline justify-between">
        <p className={cn('text-[15px] font-bold', isDarkBg ? 'text-white' : 'text-text-primary')}>참석 현황</p>
        {showCapacity ? (
          <span className={cn('text-[13px]', isDarkBg ? 'text-white/70' : 'text-text-secondary')}>
            정원 {summary.attending}/{summary.capacity}
          </span>
        ) : (
          <span className={cn('text-[13px]', isDarkBg ? 'text-white/70' : 'text-text-secondary')}>
            총 {summary.total}명
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Stat
          label={attendingLabel}
          value={summary.attending}
          color="text-primary"
          isDarkBg={isDarkBg}
        />
        <span className="h-8 w-px bg-border" />
        <Stat
          label={maybeLabel}
          value={summary.maybe}
          color="text-yellow-400"
          isDarkBg={isDarkBg}
        />
        <span className="h-8 w-px bg-border" />
        <Stat
          label={declinedLabel}
          value={summary.declined}
          color="text-gray-500"
          isDarkBg={isDarkBg}
        />
        {variant === 'host' && summary.noResponse !== undefined ? (
          <>
            <span className="h-8 w-px bg-border" />
            <Stat
              label="미응답"
              value={summary.noResponse}
              color="text-gray-400"
              isDarkBg={isDarkBg}
            />
          </>
        ) : null}
      </div>
    </div>
  );
});
