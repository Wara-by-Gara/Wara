"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { StickyHeader } from "@/components/layout/StickyHeader";
import { mobileMainScroll } from "@/lib/mobilePageLayout";
import { useDmUnreadCount } from "@/hooks/useConversations";
import { useScrolled } from "@/hooks/useScrolled";
import { cn } from "@/lib/cn";
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
  // 최상단이 아니면 세그먼트를 '유령 모드'로 — 배경·블러 제거하고 글자/선택표시를
  // 연하게 해서 뒤 친구 리스트를 가리지 않게 한다.
  const ghost = useScrolled();

  return (
    <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col overflow-x-hidden bg-surface-muted lg:max-w-none">
      {/* 타이틀은 아래 세그먼트 탭(친구/채팅)과 중복돼 생략 — 헤더는 상단 aura·여백만 담당.
          데스크톱(lg)은 전역 TopNavigation이 상단을 차지하므로 빈 헤더는 숨긴다(2단 헤더·빈 공간 방지). */}
      <div className="lg:hidden">
        <StickyHeader />
      </div>

      {/* 친구 | 채팅 세그먼트 — 모바일은 상단 고정 글래스 알약(window 스크롤이라 sticky 대신 fixed).
          데스크톱은 전역 헤더(fixed h-[--header-height]) 아래로 내려, 겹쳐 가려지지 않게 static 인라인으로 강등한다. */}
      <div className="fixed inset-x-0 top-[28px] z-40 mx-auto w-full max-w-md px-page lg:static lg:top-auto lg:mt-2 lg:max-w-5xl">
        <div
          className={cn(
            "flex gap-1 rounded-full p-1 transition-all duration-300",
            ghost
              ? "bg-transparent ring-0"
              : "bg-surface/45 ring-1 ring-border-strong/50 backdrop-blur-md",
          )}
        >
          <SegmentTab
            label="친구"
            active={tab === "friends"}
            ghost={ghost}
            onClick={() => setTab("friends")}
          />
          <SegmentTab
            label="채팅"
            active={tab === "chat"}
            ghost={ghost}
            onClick={() => setTab("chat")}
            count={dmUnread?.count ?? 0}
          />
        </div>
      </div>

      <main className={`relative z-10 ${mobileMainScroll} pt-[80px] lg:mx-auto lg:w-full lg:max-w-5xl lg:pt-2`}>
        {tab === "friends" ? <FriendsList /> : <ChatList />}
      </main>
    </div>
  );
};

const SegmentTab = ({
  label,
  active,
  ghost,
  onClick,
  count = 0,
}: {
  label: string;
  active: boolean;
  ghost: boolean;
  onClick: () => void;
  count?: number;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "flex flex-1 items-center justify-center gap-1.5 rounded-full py-2 text-[14px] font-bold transition-all duration-300",
      // 유령 모드: 흰 배경 대신 선택탭은 테두리만, 글자는 연하게 → 리스트 안 가림
      ghost
        ? active
          ? "ring-1 ring-inset ring-text/12 text-text/55"
          : "text-text-muted/35 active:opacity-70"
        : active
          ? "bg-surface/85 text-text shadow-sm"
          : "text-text-muted active:opacity-70",
    )}
  >
    {label}
    {count > 0 && (
      <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
        {count > 99 ? "99+" : count}
      </span>
    )}
  </button>
);
