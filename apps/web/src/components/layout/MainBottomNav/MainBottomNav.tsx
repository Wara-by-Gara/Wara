"use client";

import { BottomNavigation } from "@/components/molecules/BottomNavigation";
import { MAIN_BOTTOM_NAV_ITEMS, type MainBottomNavKey } from "@/lib/mainBottomNav";

export interface MainBottomNavProps {
  activeKey: MainBottomNavKey;
}

export function MainBottomNav({ activeKey }: MainBottomNavProps) {
  return (
    <div className="relative z-10 shrink-0">
      <BottomNavigation items={MAIN_BOTTOM_NAV_ITEMS} activeKey={activeKey} />
    </div>
  );
}
