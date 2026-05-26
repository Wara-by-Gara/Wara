"use client";

import Link from "next/link";
import { BottomNavigation, type BottomNavItem } from "@/components/molecules/BottomNavigation";
import { MAIN_BOTTOM_NAV_ITEMS, type MainBottomNavKey } from "@/lib/mainBottomNav";
import { ROUTES } from "@/constants/routes";
import type { ReactNode } from "react";

const NAV_ROUTES: Record<MainBottomNavKey, string> = {
  home: ROUTES.HOME,
  invitations: ROUTES.INVITATIONS.LIST,
  create: ROUTES.INVITATIONS.CREATE,
  notifications: ROUTES.NOTIFICATIONS.LIST,
  me: ROUTES.PROFILE.ME,
};

export interface MainBottomNavProps {
  activeKey: MainBottomNavKey;
}

export function MainBottomNav({ activeKey }: MainBottomNavProps) {
  function renderItem(item: BottomNavItem, content: ReactNode) {
    const href = NAV_ROUTES[item.key as MainBottomNavKey];
    if (!href) return content;
    return (
      <Link href={href} className="flex flex-1 items-center justify-center">
        {content}
      </Link>
    );
  }

  return (
    <div className="relative z-10 shrink-0">
      <BottomNavigation
        items={MAIN_BOTTOM_NAV_ITEMS}
        activeKey={activeKey}
        renderItem={renderItem}
      />
    </div>
  );
}
