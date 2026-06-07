import { Icon } from "@/components/icons";
import { cn } from "@/lib/cn";
import { LumaShimmer } from "./Text";

export function LumaEventTitle({
  title,
  isPrivate,
  isExternal,
  loading,
}: {
  title: string;
  isPrivate?: boolean;
  isExternal?: boolean;
  loading?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      {isPrivate ? <Icon name="lock" size="sm" color="primary" decorative /> : null}
      <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
      {isExternal ? <Icon name="external-link" size="sm" color="tertiary" decorative /> : null}
      {loading ? <div className="h-4 w-16"><LumaShimmer lines={1} /></div> : null}
    </div>
  );
}

export type LumaEventTimeVariant = "default" | "live" | "highlight" | "relative";

export function LumaEventTimeRow({
  time,
  variant = "default",
}: {
  time: string;
  variant?: LumaEventTimeVariant;
}) {
  return (
    <div className="flex items-center gap-2 border-b border-border px-4 py-3 last:border-b-0">
      {variant === "live" ? (
        <>
          <span className="size-2 rounded-full bg-orange-500" />
          <span className="text-sm font-semibold text-orange-400">LIVE</span>
          <span className="text-sm text-orange-400">{time}</span>
        </>
      ) : (
        <span
          className={cn(
            "text-sm",
            variant === "highlight" ? "text-yellow-400" : variant === "relative" ? "text-text-primary" : "text-text-secondary",
          )}
        >
          {time}
        </span>
      )}
    </div>
  );
}

export function LumaEventTimeList({ items }: { items: { time: string; variant?: LumaEventTimeVariant }[] }) {
  return (
    <div className="overflow-hidden rounded-sm border border-gray-800 bg-white/4">
      {items.map((item, i) => (
        <LumaEventTimeRow key={i} time={item.time} variant={item.variant} />
      ))}
    </div>
  );
}
