import type { BottomNavItem } from "@/components/molecules/BottomNavigation";

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
