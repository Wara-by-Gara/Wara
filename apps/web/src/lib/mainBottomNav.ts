import type { BottomNavItem } from "@/components/molecules/BottomNavigation";

/** Storybook FiveTabsWithFab와 동일한 메인 탭 구성 */
export const MAIN_BOTTOM_NAV_ITEMS: BottomNavItem[] = [
  { key: "home", label: "홈", icon: "home" },
  { key: "calendar", label: "캘린더", icon: "calendar" },
  { key: "create", label: "만들기", icon: "plus", fab: true },
  { key: "friends", label: "친구", icon: "users" },
  { key: "me", label: "마이페이지", icon: "user" },
];

export type MainBottomNavKey =
  | "home"
  | "calendar"
  | "create"
  | "friends"
  | "me";
