import { Icon } from "@/components/icons";
import type { IconName } from "@/components/icons";
const SHOWCASE_ICONS: IconName[] = [
  "calendar", "clock", "bell", "user", "settings", "home", "search", "share",
  "heart", "check", "x", "plus", "edit", "trash", "map-pin", "camera",
  "message-circle", "users", "lock", "info",
];

export function LumaIconGrid({ size = 24 }: { size?: 16 | 24 }) {
  const iconSize = size === 16 ? "sm" : "lg";
  return (
    <div className="grid grid-cols-5 gap-4">
      {SHOWCASE_ICONS.map((name) => (
        <div
          key={name}
          className="flex flex-col items-center gap-2 rounded-sm bg-gray-50 p-4"
        >
          <Icon name={name} size={iconSize} color="default" decorative />
          <span className="text-[10px] text-text-tertiary">{name}</span>
        </div>
      ))}
    </div>
  );
}

export function LumaIconSearch() {
  return (
    <div className="relative">
      <Icon name="search" size="sm" color="tertiary" decorative className="absolute left-3 top-1/2 -translate-y-1/2" />
      <input
        type="search"
        placeholder="아이콘 검색..."
        className="h-[38px] w-full rounded-xs border border-border-strong bg-surface pl-9 pr-3 text-sm outline-none placeholder:text-text-tertiary"
      />
    </div>
  );
}

export function LumaIconSizes() {
  return (
    <div className="flex items-end gap-6">
      {([16, 24] as const).map((s) => (
        <div key={s} className="flex flex-col items-center gap-2">
          <Icon name="bell" size={s === 16 ? "sm" : "lg"} color="default" decorative />
          <span className="text-xs text-text-tertiary">{s}px</span>
        </div>
      ))}
    </div>
  );
}
