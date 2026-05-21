import { cn } from "@/lib/cn";

export interface HomeIndicatorProps {
  className?: string;
}

export function HomeIndicator({ className }: HomeIndicatorProps) {
  return (
    <div
      className={cn(
        "pointer-events-none flex h-[28px] w-full items-end justify-center pb-[8px]",
        className,
      )}
    >
      <span className="block h-[5px] w-[134px] rounded-full bg-black/80" />
    </div>
  );
}
