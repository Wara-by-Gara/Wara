"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useDmUnreadCount } from "@/hooks/useConversations";
import { useTermsCompliance } from "@/hooks/useTermsCompliance";
import {
  isMainNavHidden,
  resolveMainNavActiveKey,
} from "@/lib/mainBottomNav";

/**
 * 하단 탭(MainBottomNav)과 데스크톱 헤더(TopNavigation)가 공유하는 상태.
 * 표현(FAB/가로 메뉴)은 각 컴포넌트가, 데이터·판정은 여기서 담당한다.
 */
export function useMainNav() {
  const pathname = usePathname();
  const { isLoggedIn, hydrated } = useAuthStore();
  const { isCompliant } = useTermsCompliance();
  const { data: dmUnread } = useDmUnreadCount(
    hydrated && isLoggedIn && isCompliant === true,
  );
  const [loginSheetOpen, setLoginSheetOpen] = useState(false);

  return {
    hidden: isMainNavHidden(pathname),
    activeKey: resolveMainNavActiveKey(pathname),
    isLoggedIn,
    hydrated,
    hasUnreadDm: (dmUnread?.count ?? 0) > 0,
    loginSheetOpen,
    setLoginSheetOpen,
  };
}
