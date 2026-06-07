import type { BottomNavItem } from "@/components/molecules/BottomNavigation";

export const MAIN_BOTTOM_NAV_ITEMS: BottomNavItem[] = [
  { key: "home", label: "홈", icon: "home" },
  { key: "explore", label: "탐색", icon: "compass" },
  { key: "create", label: "만들기", icon: "plus", fab: true },
  { key: "friends", label: "친구", icon: "users" },
  { key: "profile", label: "프로필", icon: "user" },
];

export type MainBottomNavKey =
  | "home"
  | "explore"
  | "create"
  | "friends"
  | "profile";
