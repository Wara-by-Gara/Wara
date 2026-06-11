"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BottomNavigation, type BottomNavItem } from "@/components/molecules/BottomNavigation";
import { BottomSheet, BottomSheetContent } from "@/components/molecules/BottomSheet";
import { SocialLoginButton } from "@/components/primitives/SocialLoginButton";
import { MAIN_BOTTOM_NAV_ITEMS, type MainBottomNavKey } from "@/lib/mainBottomNav";
import { ROUTES } from "@/constants/routes";
import { useAuthStore } from "@/stores/authStore";
import { useDmUnreadCount } from "@/hooks/useConversations";
import { useTermsCompliance } from "@/hooks/useTermsCompliance";
import { API_BASE } from "@/lib/env";
import type { SocialProvider } from "@/components/primitives/SocialLoginButton/providers";
import type { ReactNode } from "react";

const NAV_ROUTES: Record<MainBottomNavKey, string> = {
  home: ROUTES.HOME,
  meetings: ROUTES.MEETINGS,
  create: ROUTES.INVITATIONS.CREATE,
  friends: ROUTES.FRIENDS.LIST,
  profile: ROUTES.PROFILE.ME,
};

const HIDDEN_PATHS = [
  "/login",
  "/signup",
  "/edit",
  "/invitations/create",
  "/terms/agree",
  "/terms/service",
  "/terms/privacy",
  "/onboarding",
];

function resolveActiveKey(pathname: string): MainBottomNavKey {
  if (pathname === "/") return "home";
  if (pathname.startsWith("/invitations/create")) return "create";
  if (pathname.startsWith("/meetings")) return "meetings";
  if (pathname.startsWith("/friends")) return "friends";
  if (pathname.startsWith("/profile")) return "profile";
  return "home";
}

export interface MainBottomNavProps {
  activeKey?: MainBottomNavKey;
}

export function MainBottomNav({ activeKey: activeKeyProp }: MainBottomNavProps) {
  const pathname = usePathname();
  const { isLoggedIn, hydrated } = useAuthStore();
  const [loginSheetOpen, setLoginSheetOpen] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState<SocialProvider | null>(null);
  const { isCompliant } = useTermsCompliance();
  const { data: dmUnread } = useDmUnreadCount(hydrated && isLoggedIn && isCompliant === true);

  function handleSocialLogin(provider: SocialProvider) {
    setLoadingProvider(provider);
    window.location.href = `${API_BASE}/auth/${provider}/redirect`;
  }

  if (
    HIDDEN_PATHS.includes(pathname) ||
    pathname.endsWith("/location") ||
    pathname.startsWith("/chats/")
  )
    return null;

  const activeKey = activeKeyProp ?? resolveActiveKey(pathname);


  const hasUnreadDm = (dmUnread?.count ?? 0) > 0;
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
    <>
      <div
        aria-hidden="true"
        className="shrink-0 h-[calc(4rem+env(safe-area-inset-bottom))]"
      />
      <div className="fixed bottom-0 left-0 right-0 z-10 mx-auto w-full max-w-md pb-[env(safe-area-inset-bottom)]">
        <BottomNavigation
          items={items}
          activeKey={activeKey}
          renderItem={renderItem}
          showLabels
        />
      </div>

      <BottomSheet open={loginSheetOpen} onOpenChange={setLoginSheetOpen}>
        <BottomSheetContent title="로그인" description="소셜 계정으로 간편하게 시작해보세요">
          <div className="flex flex-col gap-2.5 pt-2">
            {(["kakao", "naver", "google", "apple"] as const).map((provider) => (
              <SocialLoginButton
                key={provider}
                provider={provider}
                loading={loadingProvider === provider}
                disabled={loadingProvider !== null}
                onClick={() => handleSocialLogin(provider)}
              />
            ))}
          </div>
        </BottomSheetContent>
      </BottomSheet>
    </>
  );
}
