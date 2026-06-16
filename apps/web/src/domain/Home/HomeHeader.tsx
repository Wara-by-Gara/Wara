"use client";

import { useRouter } from "next/navigation";
import { Icon } from "@/components/icons";
import { StickyHeader } from "@/components/layout/StickyHeader";
import { ROUTES } from "@/constants/routes";
import { useUnreadCount } from "@/hooks/useNotifications";
import { cn } from "@/lib/cn";

const pillActionClass =
  "inline-flex size-8 items-center justify-center rounded-full text-text transition-colors hover:bg-white/30 active:bg-white/40";

export function HomeHeader() {
  const router = useRouter();
  const { data: unreadData } = useUnreadCount();
  const hasUnread = (unreadData?.count ?? 0) > 0;

  return (
    <StickyHeader
      rightSlot={
        <div className="inline-flex h-9 items-center rounded-full border border-white/55 bg-transparent px-1 shadow-xs backdrop-blur-2xl backdrop-saturate-150">
          <button
            type="button"
            aria-label="초대장 만들기"
            className={pillActionClass}
            onClick={() => router.push(ROUTES.INVITATIONS.CREATE)}
          >
            <Icon name="plus" size="sm" color="currentColor" decorative />
          </button>
          <button
            type="button"
            aria-label={hasUnread ? "알림, 읽지 않은 알림 있음" : "알림"}
            className={cn(pillActionClass, "relative ml-0.5")}
            onClick={() => router.push(ROUTES.NOTIFICATIONS.LIST)}
          >
            <Icon name="bell" size="sm" color="currentColor" decorative />
            {hasUnread && (
              <span className="absolute right-1 top-1 size-2 rounded-full bg-red-500" />
            )}
          </button>
        </div>
      }
    />
  );
}
