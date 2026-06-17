"use client";

import { Icon } from "@wara/ui";
import { cn } from "@/lib/cn";
import { resolveBadges, type BadgeStats } from "./badges";

/** 마이페이지 업적 배지 — 획득/미획득 그리드 */
export function BadgesSection(stats: BadgeStats) {
  const badges = resolveBadges(stats);
  const earnedCount = badges.filter((b) => b.earned).length;

  return (
    <div className="bg-surface px-4 py-4 shadow-sm">
      <div className="mb-3 flex items-center gap-1.5">
        <span className="text-[15px]">🏅</span>
        <span className="text-[14px] font-bold text-text-primary">업적 배지</span>
        <span className="text-[12px] text-text-tertiary">
          {earnedCount}/{badges.length}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {badges.map((b) => (
          <div
            key={b.key}
            className={cn(
              "flex flex-col items-center gap-1.5 rounded-2xl p-3 text-center",
              b.earned ? "bg-background-soft" : "opacity-40",
            )}
          >
            <span
              className={cn(
                "inline-flex size-11 items-center justify-center rounded-full",
                b.earned ? "bg-yellow-100 text-yellow-500" : "bg-surface-muted text-text-disabled",
              )}
            >
              <Icon name={b.icon} size="md" color="currentColor" decorative />
            </span>
            <span className="text-[12px] font-bold text-text-primary">{b.label}</span>
            <span className="text-[10px] leading-tight text-text-tertiary">
              {b.earned ? b.description : `${b.current}/${b.threshold}`}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
