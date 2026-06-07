import { cn } from "@/lib/cn";
import { Icon } from "@/components/icons";
import { LumaInitialsAvatar } from "./Social";

export function LumaChatLauncher({ badge }: { badge?: number }) {
  return (
    <div className="relative inline-flex">
      <button
        type="button"
        className="flex size-12 items-center justify-center rounded-full bg-gray-800 text-text-primary hover:bg-gray-700"
      >
        <Icon name="message-circle" size="lg" color="inverse" decorative />
      </button>
      {badge ? (
        <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
          {badge > 99 ? "99" : badge}
        </span>
      ) : null}
    </div>
  );
}

export function LumaFloatingHead({
  initials,
  online,
  selected,
}: {
  initials: string;
  online?: boolean;
  selected?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative inline-flex size-9 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white",
        selected && "ring-2 ring-white ring-offset-2 ring-offset-background",
      )}
    >
      {initials}
      <span
        className={cn(
          "absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-background",
          online ? "bg-green-500" : "bg-red-500",
        )}
      />
    </div>
  );
}

export function LumaMessageBubble({
  message,
  isMe,
  timestamp,
}: {
  message: string;
  isMe?: boolean;
  timestamp?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1", isMe ? "items-end" : "items-start")}>
      {timestamp ? <span className="text-xs text-text-tertiary">{timestamp}</span> : null}
      <div
        className={cn(
          "max-w-[280px] rounded-sm px-3 py-2 text-sm break-words",
          isMe ? "bg-blue-500 text-white rounded-br-sm" : "bg-white/8 text-text-primary rounded-bl-sm",
        )}
      >
        {message}
      </div>
    </div>
  );
}

export function LumaSystemMessage({ message }: { message: string }) {
  return <p className="text-center text-xs text-text-tertiary">{message}</p>;
}

export function LumaChatThread() {
  return (
    <div className="space-y-3">
      <LumaSystemMessage message="오후 3:00에 대화가 시작되었습니다" />
      <div className="flex items-end gap-2">
        <LumaInitialsAvatar initials="GC" size={24} />
        <LumaMessageBubble message="안녕하세요! 참석 가능합니다." />
      </div>
      <LumaMessageBubble message="네, 기대하고 있을게요!" isMe timestamp="오후 3:05" />
    </div>
  );
}
