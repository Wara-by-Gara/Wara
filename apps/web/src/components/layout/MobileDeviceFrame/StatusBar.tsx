import { cn } from "@/lib/cn";

export interface StatusBarProps {
  className?: string;
}

export function StatusBar({ className }: StatusBarProps) {
  return (
    <div
      className={cn(
        "pointer-events-none flex h-[44px] w-full items-center justify-between px-7 pt-2 text-[15px] font-semibold leading-none text-black",
        className,
      )}
    >
      <span className="tabular-nums tracking-tight">9:41</span>
      <div className="flex items-center gap-[6px]">
        <SignalIcon />
        <WifiIcon />
        <BatteryIcon />
      </div>
    </div>
  );
}

function SignalIcon() {
  return (
    <svg
      width="17"
      height="11"
      viewBox="0 0 17 11"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect x="0" y="7" width="3" height="4" rx="0.8" fill="currentColor" />
      <rect x="4.5" y="5" width="3" height="6" rx="0.8" fill="currentColor" />
      <rect x="9" y="3" width="3" height="8" rx="0.8" fill="currentColor" />
      <rect x="13.5" y="0" width="3" height="11" rx="0.8" fill="currentColor" />
    </svg>
  );
}

function WifiIcon() {
  return (
    <svg
      width="16"
      height="11"
      viewBox="0 0 16 11"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M8 10.2a1.3 1.3 0 1 0 0-2.6 1.3 1.3 0 0 0 0 2.6Z"
        fill="currentColor"
      />
      <path
        d="M3.4 6.1a6.5 6.5 0 0 1 9.2 0l-1.2 1.2a4.8 4.8 0 0 0-6.8 0L3.4 6.1Z"
        fill="currentColor"
      />
      <path
        d="M0.6 3.4a10.4 10.4 0 0 1 14.8 0L14.2 4.6a8.7 8.7 0 0 0-12.4 0L0.6 3.4Z"
        fill="currentColor"
      />
    </svg>
  );
}

function BatteryIcon() {
  return (
    <svg
      width="27"
      height="13"
      viewBox="0 0 27 13"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect
        x="0.5"
        y="0.5"
        width="22"
        height="12"
        rx="3"
        stroke="currentColor"
        strokeOpacity="0.4"
      />
      <rect x="2" y="2" width="19" height="9" rx="1.5" fill="currentColor" />
      <path
        d="M24 4v5a1.5 1.5 0 0 0 1.5-1.5v-2A1.5 1.5 0 0 0 24 4Z"
        fill="currentColor"
        fillOpacity="0.4"
      />
    </svg>
  );
}
