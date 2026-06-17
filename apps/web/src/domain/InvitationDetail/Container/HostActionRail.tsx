"use client";

import { Icon, type IconName } from "@/components/icons";
import { cn } from "@/lib/cn";

type RailAction = {
  icon: IconName;
  label: string;
  onClick: () => void;
};

type Props = {
  goingCount: number;
  onParticipants: () => void;
  edit: RailAction;
  textBlast: RailAction;
  invite: RailAction;
  more: RailAction;
};

/**
 * 데스크톱(lg:) 우측 고정 호스트 액션 레일. 모바일에선 숨김(기존 더보기 시트가 대체).
 */
export function HostActionRail({
  goingCount,
  onParticipants,
  edit,
  textBlast,
  invite,
  more,
}: Props) {
  return (
    <aside className="fixed right-6 top-1/2 z-20 hidden -translate-y-1/2 flex-col rounded-2xl bg-surface/90 shadow-lg ring-1 ring-border backdrop-blur-md lg:flex">
      <RailTile {...edit} />
      <Divider />
      <RailTile {...textBlast} />
      <Divider />
      <button
        type="button"
        onClick={onParticipants}
        className="flex w-24 flex-col items-center gap-1 px-3 py-4 transition-colors hover:bg-gray-50"
      >
        <span className="flex size-9 items-center justify-center rounded-full text-[17px] font-bold text-primary ring-1 ring-border">
          {goingCount}
        </span>
        <span className="text-[11px] font-medium text-text-muted">참석</span>
      </button>
      <Divider />
      <RailTile {...invite} />
      <Divider />
      <RailTile {...more} hideLabel />
    </aside>
  );
}

function RailTile({
  icon,
  label,
  onClick,
  hideLabel,
}: RailAction & { hideLabel?: boolean }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cn(
        "flex w-24 flex-col items-center gap-1 px-3 py-4 transition-colors hover:bg-gray-50",
      )}
    >
      <Icon name={icon} size="md" color="default" decorative />
      {hideLabel ? null : (
        <span className="text-[11px] font-medium text-text-muted">{label}</span>
      )}
    </button>
  );
}

function Divider() {
  return <span aria-hidden className="mx-3 h-px bg-border" />;
}
