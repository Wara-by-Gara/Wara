"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { StickyHeader } from "@/components/layout/StickyHeader";
import { mobileMainScroll, stickyMainTop } from "@/lib/mobilePageLayout";
import { useDmUnreadCount } from "@/hooks/useConversations";
import { FriendsList } from "./FriendsList";
import { ChatList } from "./ChatList";

type Tab = "friends" | "chat";

export const Friends = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  // 세그먼트 탭을 URL로 관리 → 채팅방에서 뒤로가기 시 채팅 탭으로 복귀
  const tab: Tab = searchParams.get("tab") === "chat" ? "chat" : "friends";
  const setTab = (next: Tab) =>
    router.replace(next === "chat" ? "/friends?tab=chat" : "/friends", {
      scroll: false,
    });
  const { data: dmUnread } = useDmUnreadCount();

  return (
    <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col overflow-x-hidden bg-background-soft">
      <StickyHeader title={tab === "friends" ? "친구" : "채팅"} />
      <main className={`relative z-10 ${mobileMainScroll} ${stickyMainTop}`}>
        {/* 친구 | 채팅 세그먼트 (콘텐츠 최상단) */}
        <div className="mx-page mb-1 mt-3 flex gap-1 rounded-full bg-border p-1">
          <SegmentTab label="친구" active={tab === "friends"} onClick={() => setTab("friends")} />
          <SegmentTab
            label="채팅"
            active={tab === "chat"}
            onClick={() => setTab("chat")}
            count={dmUnread?.count ?? 0}
          />
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
  count = 0,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  count?: number;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex flex-1 items-center justify-center gap-1.5 rounded-full py-2 text-[14px] font-bold transition-colors ${
      active
        ? "bg-surface text-text-primary shadow-sm"
        : "text-text-secondary active:opacity-70"
    }`}
  >
    {label}
    {count > 0 && (
      <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
        {count > 99 ? "99+" : count}
      </span>
    )}
  </button>
);
