"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/primitives/Avatar";
import { SearchBar } from "@/components/molecules/SearchBar";
import { EmptyState } from "@/components/organisms/EmptyState";
import { FriendsPageSkeleton } from "@/components/organisms/Skeleton";
import { ROUTES } from "@/constants/routes";
import { timeAgo } from "@/utils/timeAge";
import { useConversations } from "@/hooks/useConversations";
import { matchName } from "./initials";

export const ChatList = () => {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const { data: conversations = [], isLoading, isError, refetch } = useConversations();

  const keyword = query.trim();
  const filtered = keyword
    ? conversations.filter((c) => matchName(c.partner.name, keyword))
    : conversations;

  const goRoom = (id: string) => router.push(ROUTES.CHAT.ROOM(id));

  if (isLoading) return <FriendsPageSkeleton />;

  if (isError) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-page">
        <EmptyState icon="message-circle" title="대화를 불러오지 못했어요" />
        <button
          type="button"
          onClick={() => refetch()}
          className="text-[14px] font-bold text-primary active:opacity-70"
        >
          다시 시도
        </button>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-page">
        <EmptyState
          icon="message-circle"
          title="아직 대화가 없어요"
          description="친구 프로필에서 메시지를 보내보세요"
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col pb-6 pt-3">
      <div className="px-page pb-3">
        <SearchBar
          placeholder="이름으로 대화 검색"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      {filtered.length === 0 ? (
        <EmptyState icon="search" title="검색 결과가 없어요" />
      ) : (
        <ul className="divide-y divide-border bg-surface">
          {filtered.map((c) => {
            const name = c.partner.name ?? "이름 없음";
            return (
              <li key={c.id}>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => goRoom(c.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      goRoom(c.id);
                    }
                  }}
                  className="flex cursor-pointer items-center gap-3 px-page py-3 active:bg-background-soft"
                >
                  <Avatar size="md" src={c.partner.avatarUrl ?? undefined} alt={name} initial={name[0]} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-bold text-text-primary">{name}</p>
                    <p className="line-clamp-2 text-[13px] text-text-tertiary">
                      {c.lastMessageText ?? "대화를 시작해보세요"}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end justify-between self-stretch py-0.5">
                    <span className="text-[11px] text-text-tertiary">
                      {c.lastMessageAt ? timeAgo(c.lastMessageAt) : ""}
                    </span>
                    {c.unreadCount > 0 && (
                      <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-white">
                        {c.unreadCount > 99 ? "99+" : c.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
