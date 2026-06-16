import { type ReactNode } from "react";
import { Avatar } from "@wara/ui";
import { cn } from "@/lib/cn";

export interface ProfileStat {
  label: string;
  value: ReactNode;
}

export interface ProfileSummaryProps {
  name: string;
  handle?: string;
  bio?: ReactNode;
  avatarUrl?: string;
  /** 통계 행 (모임 수·친구 수 등) */
  stats?: ProfileStat[];
  /** 우측/하단 액션 (편집·친구추가 등) */
  action?: ReactNode;
  className?: string;
}

export function ProfileSummary({
  name,
  handle,
  bio,
  avatarUrl,
  stats,
  action,
  className,
}: ProfileSummaryProps) {
  return (
    <div className={cn("flex flex-col items-center gap-3 text-center", className)}>
      <Avatar src={avatarUrl} name={name} size="2xl" />
      <div className="flex flex-col items-center gap-0.5">
        <h2 className="type-sectionTitle text-text">{name}</h2>
        {handle ? <p className="type-bodySmall text-text-muted">@{handle}</p> : null}
      </div>
      {bio ? <p className="type-bodySmall max-w-sm text-text-muted">{bio}</p> : null}

      {stats && stats.length > 0 ? (
        <div className="mt-1 flex items-stretch gap-6">
          {stats.map((s, i) => (
            <div key={i} className="flex flex-col items-center">
              <span className="type-cardTitle text-text">{s.value}</span>
              <span className="type-caption text-text-muted">{s.label}</span>
            </div>
          ))}
        </div>
      ) : null}

      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
