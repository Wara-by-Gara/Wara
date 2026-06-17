import type { BottomNavItem } from "@/components/molecules/BottomNavigation";
import { ROUTES } from "@/constants/routes";

export const MAIN_BOTTOM_NAV_ITEMS: BottomNavItem[] = [
  { key: "home", label: "홈", icon: "home" },
  { key: "meetings", label: "일정", icon: "calendar" },
  { key: "create", label: "만들기", icon: "plus", fab: true },
  { key: "friends", label: "친구", icon: "users" },
  { key: "profile", label: "프로필", icon: "user" },
];

export type MainBottomNavKey =
  | "home"
  | "meetings"
  | "create"
  | "friends"
  | "profile";

/** nav key → 라우트 (하단 탭·데스크톱 헤더 공용) */
export const NAV_ROUTES: Record<MainBottomNavKey, string> = {
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

/** 현재 경로에서 주요 네비게이션(하단 탭·데스크톱 헤더)을 숨길지 여부 */
export function isMainNavHidden(pathname: string): boolean {
  return (
    HIDDEN_PATHS.includes(pathname) ||
    pathname.endsWith("/location") ||
    pathname.startsWith("/chats/")
  );
}

export function resolveMainNavActiveKey(pathname: string): MainBottomNavKey {
  if (pathname === "/") return "home";
  if (pathname.startsWith("/invitations/create")) return "create";
  if (pathname.startsWith("/meetings")) return "meetings";
  if (pathname.startsWith("/friends")) return "friends";
  if (pathname.startsWith("/profile")) return "profile";
  return "home";
}
