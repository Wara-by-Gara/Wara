"use client";

import { useLightTheme } from "@/hooks/useLightTheme";

export default function InvitationDetailLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  useLightTheme();
  return (
    <>
      {children}
      {modal}
    </>
  );
}
