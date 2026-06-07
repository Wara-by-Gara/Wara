"use client";

import { Icon } from "@/components/icons";
import { cn } from "@/lib/cn";

export function LumaDateTimeRange({
  date,
  startTime,
  endTime,
  timezone,
  hideTimezone,
}: {
  date: string;
  startTime: string;
  endTime: string;
  timezone?: string;
  hideTimezone?: boolean;
}) {
  return (
    <div className="space-y-2 rounded-sm border border-gray-800 bg-white/4 p-4">
      <p className="text-base font-semibold text-text-primary">{date}</p>
      <div className="flex items-center gap-2 text-base font-semibold text-text-primary">
        <span>{startTime}</span>
        <Icon name="chevron-right" size="sm" color="tertiary" decorative />
        <span>{endTime}</span>
      </div>
      {!hideTimezone && timezone ? (
        <p className="flex items-center gap-1.5 text-sm text-text-tertiary">
          <Icon name="globe" size="sm" color="tertiary" decorative />
          {timezone}
        </p>
      ) : null}
    </div>
  );
}

export function LumaDateTimeInput({
  date,
  time,
  className,
}: {
  date: string;
  time: string;
  className?: string;
}) {
  return (
    <div className={cn("flex h-[38px] items-center justify-between rounded-xs border border-gray-800 bg-background px-3.5", className)}>
      <span className="text-base text-text-primary">{date}</span>
      <span className="text-base text-text-primary">{time}</span>
    </div>
  );
}

export function LumaTimezoneSelector({ value }: { value: string }) {
  return (
    <button
      type="button"
      className="flex h-[38px] w-full items-center justify-between rounded-xs border border-gray-800 bg-background px-3.5 text-base text-text-primary"
    >
      <span>{value}</span>
      <Icon name="chevron-down" size="sm" color="tertiary" decorative />
    </button>
  );
}
