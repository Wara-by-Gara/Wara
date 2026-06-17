"use client";

import Link from "next/link";
import { Icon, type IconName } from "@/components/icons";
import { Button } from "@wara/ui";
import { LoginSheet } from "@/components/auth/login-sheet";
import { NAV_ROUTES, type MainBottomNavKey } from "@/lib/mainBottomNav";
import { ROUTES } from "@/constants/routes";
import { useMainNav } from "@/hooks/useMainNav";
import { cn } from "@/lib/cn";

interface TopNavLink {
  key: Exclude<MainBottomNavKey, "create">;
  label: string;
  icon: IconName;
}

/** 가로 메뉴 항목 — create는 우측 primary 버튼으로 분리 */
const TOP_NAV_LINKS: TopNavLink[] = [
  { key: "home", label: "홈", icon: "home" },
  { key: "meetings", label: "일정", icon: "calendar" },
  { key: "friends", label: "친구", icon: "users" },
  { key: "profile", label: "프로필", icon: "user" },
];

/**
 * 데스크톱(lg:) 상단 고정 헤더. 모바일/태블릿에선 숨김(하단 탭이 대체).
 * 높이는 --header-height 토큰과 일치.
 */
export function TopNavigation() {
  const {
    hidden,
    activeKey,
    isLoggedIn,
    hydrated,
    hasUnreadDm,
    loginSheetOpen,
    setLoginSheetOpen,
  } = useMainNav();

  if (hidden) return null;

  return (
    <>
    <header className="fixed inset-x-0 top-0 z-30 hidden h-[var(--header-height)] border-b border-border bg-surface lg:flex">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <Link
            href={ROUTES.HOME}
            className="text-xl font-bold tracking-tight text-text"
          >
            WARA
          </Link>
          <nav aria-label="주요 메뉴" className="flex items-center gap-1">
            {TOP_NAV_LINKS.map((link) => {
              const active = link.key === activeKey;
              const isLoginItem = link.key === "profile" && hydrated && !isLoggedIn;
              const label = isLoginItem ? "로그인" : link.label;
              const showBadge = link.key === "friends" && hasUnreadDm;

              const content = (
                <span
                  className={cn(
                    "relative flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary-soft text-primary"
                      : "text-text-muted hover:bg-gray-50 hover:text-text",
                  )}
                >
                  <Icon
                    name={isLoginItem ? "user-plus" : link.icon}
                    size="sm"
                    color="currentColor"
                    decorative
                  />
                  {label}
                  {showBadge ? (
                    <span
                      aria-hidden
                      className="absolute right-1 top-1 size-2 rounded-full bg-red-500"
                    />
                  ) : null}
                </span>
              );

              if (isLoginItem) {
                return (
                  <button
                    key={link.key}
                    type="button"
                    aria-label={label}
                    onClick={() => setLoginSheetOpen(true)}
                  >
                    {content}
                  </button>
                );
              }
              return (
                <Link
                  key={link.key}
                  href={NAV_ROUTES[link.key]}
                  aria-current={active ? "page" : undefined}
                  aria-label={label}
                >
                  {content}
                </Link>
              );
            })}
          </nav>
        </div>

        <Button asChild variant="primary" size="sm">
          <Link href={ROUTES.INVITATIONS.CREATE}>
            <Icon name="plus" size="sm" color="currentColor" decorative />
            만들기
          </Link>
        </Button>
      </div>
    </header>
    {/* 본문을 고정 헤더 아래로 밀어주는 spacer — 헤더가 렌더될 때만 존재(숨김 경로엔 여백 없음) */}
    <div aria-hidden className="hidden h-[var(--header-height)] shrink-0 lg:block" />

    <LoginSheet open={loginSheetOpen} onOpenChange={setLoginSheetOpen} />
    </>
  );
}
