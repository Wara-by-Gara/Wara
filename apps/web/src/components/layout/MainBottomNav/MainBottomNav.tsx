"use client";

import Link from "next/link";
import { BottomNavigation, type BottomNavItem } from "@/components/molecules/BottomNavigation";
import { LoginSheet } from "@/components/auth/login-sheet";
import {
  MAIN_BOTTOM_NAV_ITEMS,
  NAV_ROUTES,
  type MainBottomNavKey,
} from "@/lib/mainBottomNav";
import { useMainNav } from "@/hooks/useMainNav";
import { useUiStore } from "@/stores/uiStore";
import type { ReactNode } from "react";

export interface MainBottomNavProps {
  activeKey?: MainBottomNavKey;
}

export function MainBottomNav({ activeKey: activeKeyProp }: MainBottomNavProps) {
  const {
    hidden,
    activeKey: resolvedActiveKey,
    isLoggedIn,
    hydrated,
    hasUnreadDm,
    loginSheetOpen,
    setLoginSheetOpen,
  } = useMainNav();
  const commentInputFocused = useUiStore((s) => s.commentInputFocused);

  // 경로 기반 숨김이거나, 댓글 입력창이 포커스되어 올라온 경우 하단 탭을 숨긴다
  if (hidden || commentInputFocused) return null;

  const activeKey = activeKeyProp ?? resolvedActiveKey;

  const items = MAIN_BOTTOM_NAV_ITEMS.map((item) => {
    if (item.key === "profile" && hydrated && !isLoggedIn) {
      return { ...item, label: "로그인", icon: "user-plus" as const };
    }
    if (item.key === "friends" && hasUnreadDm) {
      return { ...item, badge: true };
    }
    return item;
  });

  function renderItem(item: BottomNavItem, content: ReactNode) {
    if (item.key === "profile" && hydrated && !isLoggedIn) {
      return (
        <button
          type="button"
          aria-label={item.label}
          className="flex flex-1 items-center justify-center"
          onClick={() => setLoginSheetOpen(true)}
        >
          {content}
        </button>
      );
    }
    const href = NAV_ROUTES[item.key as MainBottomNavKey];
    if (!href) return content;
    return (
      <Link href={href} aria-label={item.label} className="flex flex-1 items-center justify-center">
        {content}
      </Link>
    );
  }

  return (
    <div className="lg:hidden">
      <div
        aria-hidden="true"
        className="shrink-0 h-[calc(4.75rem+env(safe-area-inset-bottom))]"
      />
      {/* iOS 26 플로팅 캡슐 — 가장자리에서 띄워서 렌더 (모바일 NativeTabs 미러) */}
      <div className="fixed bottom-0 left-0 right-0 z-10 mx-auto w-full max-w-md transform-gpu px-3 pb-[calc(0.5rem+env(safe-area-inset-bottom))] will-change-transform [backface-visibility:hidden]">
        <BottomNavigation
          items={items}
          activeKey={activeKey}
          renderItem={renderItem}
          showLabels
        />
      </div>

      <LoginSheet open={loginSheetOpen} onOpenChange={setLoginSheetOpen} />
    </div>
  );
}
