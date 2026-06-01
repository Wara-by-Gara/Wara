"use client";

import { useLightTheme } from "@/hooks/useLightTheme";

export default function InvitationDetailLayout({ children }: { children: React.ReactNode }) {
  useLightTheme();
  return children;
}
