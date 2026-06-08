"use client";

import { useState } from "react";
import { StickyHeader } from "@/components/layout/StickyHeader";
import { mobileMainScroll, stickyMainTop } from "@/lib/mobilePageLayout";
import { FriendsList } from "./FriendsList";
import { ChatList } from "./ChatList";

type Tab = "friends" | "chat";

export const Friends = () => {
  const [tab, setTab] = useState<Tab>("friends");

  return (
    <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col overflow-x-hidden bg-background-soft">
      <StickyHeader title="친구" />
      <main className={`relative z-10 ${mobileMainScroll} ${stickyMainTop}`}>
        {/* 친구 | 채팅 세그먼트 (콘텐츠 최상단) */}
        <div className="mx-page mb-1 mt-3 flex gap-1 rounded-full bg-border p-1">
          <SegmentTab label="친구" active={tab === "friends"} onClick={() => setTab("friends")} />
          <SegmentTab label="채팅" active={tab === "chat"} onClick={() => setTab("chat")} />
        </div>

        {tab === "friends" ? <FriendsList /> : <ChatList />}
      </main>
    </div>
  );
};

const SegmentTab = ({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex-1 rounded-full py-2 text-[14px] font-bold transition-colors ${
      active
        ? "bg-surface text-text-primary shadow-sm"
        : "text-text-secondary active:opacity-70"
    }`}
  >
    {label}
  </button>
);
