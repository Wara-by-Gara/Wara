"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BottomNavigation, type BottomNavItem } from "@/components/molecules/BottomNavigation";
import { BottomSheet, BottomSheetContent } from "@/components/molecules/BottomSheet";
import { SocialLoginButton } from "@/components/primitives/SocialLoginButton";
import { MAIN_BOTTOM_NAV_ITEMS, type MainBottomNavKey } from "@/lib/mainBottomNav";
import { ROUTES } from "@/constants/routes";
import { useAuthStore } from "@/stores/authStore";
import type { ReactNode } from "react";

const NAV_ROUTES: Record<MainBottomNavKey, string> = {
  home: ROUTES.HOME,
  calendar: ROUTES.CALENDAR,
  create: ROUTES.INVITATIONS.CREATE,
  friends: ROUTES.FRIENDS,
  me: ROUTES.PROFILE.ME,
};

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001") + "/api";

const HIDDEN_PATHS = ["/login", "/signup", "/edit", "/invitations/create"];

function resolveActiveKey(pathname: string): MainBottomNavKey {
  if (pathname === "/") return "home";
  if (pathname.startsWith("/invitations/create")) return "create";
  if (pathname.startsWith("/calendar")) return "calendar";
  if (pathname.startsWith("/friends")) return "friends";
  return "me";
}

export interface MainBottomNavProps {
  activeKey?: MainBottomNavKey;
}

export function MainBottomNav({ activeKey: activeKeyProp }: MainBottomNavProps) {
  const pathname = usePathname();
  const { isLoggedIn, hydrated, hydrate } = useAuthStore();
  const [loginSheetOpen, setLoginSheetOpen] = useState(false);

  useEffect(() => { hydrate(); }, [hydrate]);
  if (HIDDEN_PATHS.includes(pathname) || pathname.startsWith("/i/") || pathname.endsWith("/location")) return null;

  const activeKey = activeKeyProp ?? resolveActiveKey(pathname);


  const items = MAIN_BOTTOM_NAV_ITEMS.map((item) =>
    item.key === "me" && hydrated && !isLoggedIn
      ? { ...item, label: "로그인", icon: "user-plus" as const }
      : item,
  );

  function renderItem(item: BottomNavItem, content: ReactNode) {
    if (item.key === "me" && hydrated && !isLoggedIn) {
      return (
        <button
          type="button"
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
      <Link href={href} className="flex flex-1 items-center justify-center">
        {content}
      </Link>
    );
  }

  return (
    <>
      <div aria-hidden="true" className="h-16 shrink-0" />
      <div className="fixed bottom-0 left-0 right-0 z-10 mx-auto max-w-md">
        <BottomNavigation
          items={items}
          activeKey={activeKey}
          renderItem={renderItem}
        />
      </div>

      <BottomSheet open={loginSheetOpen} onOpenChange={setLoginSheetOpen}>
        <BottomSheetContent title="로그인" description="소셜 계정으로 간편하게 시작해보세요">
          <div className="flex flex-col gap-2.5 pt-2">
            {(["kakao", "naver", "google", "apple"] as const).map((provider) => (
              <SocialLoginButton
                key={provider}
                provider={provider}
                onClick={() => { window.location.href = `${API_BASE}/auth/${provider}/redirect`; }}
              />
            ))}
          </div>
        </BottomSheetContent>
      </BottomSheet>
    </>
  );
}
