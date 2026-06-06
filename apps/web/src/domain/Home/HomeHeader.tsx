"use client";

import { useRouter } from "next/navigation";
import { Icon } from "@/components/icons";
import { StickyHeader } from "@/components/layout/StickyHeader";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/cn";

const pillActionClass =
  "inline-flex size-8 items-center justify-center rounded-full text-text-primary transition-colors hover:bg-white/30 active:bg-white/40";

export function HomeHeader() {
  const router = useRouter();

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
            aria-label="알림"
            className={cn(pillActionClass, "ml-0.5")}
            onClick={() => router.push(ROUTES.NOTIFICATIONS.LIST)}
          >
            <Icon name="bell" size="sm" color="currentColor" decorative />
          </button>
        </div>
      }
    />
  );
}
