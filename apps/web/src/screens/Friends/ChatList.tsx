"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar, EmptyState, SearchBar, Modal, ConfirmDialog } from "@wara/ui";
import { FriendsPageSkeleton } from "@/components/organisms/Skeleton";
import { ROUTES } from "@/constants/routes";
import { timeAgo } from "@/utils/timeAge";
import { useConversations, useLeaveConversation } from "@/hooks/useConversations";
import type { ConversationListItem } from "@/lib/api/conversations";
import { matchName } from "./initials";

const LONG_PRESS_MS = 500;

export const ChatList = () => {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const { data: conversations = [], isLoading, isError, refetch } = useConversations();

  const keyword = query.trim();
  const filtered = keyword
    ? conversations.filter((c) => matchName(c.title, keyword))
    : conversations;

  const goRoom = (id: string) => router.push(ROUTES.CHAT.ROOM(id));

  // 길게 눌러 나가기 — 액션 팝업 → 확인 모달
  const [actionTarget, setActionTarget] = useState<ConversationListItem | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<ConversationListItem | null>(null);
  const leave = useLeaveConversation();
  const pressTimer = useRef<number | null>(null);
  const longPressed = useRef(false);

  const startPress = (c: ConversationListItem) => {
    longPressed.current = false;
    pressTimer.current = window.setTimeout(() => {
      longPressed.current = true;
      setActionTarget(c);
    }, LONG_PRESS_MS);
  };
  const cancelPress = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };
  const handleRowClick = (id: string) => {
    if (longPressed.current) {
      longPressed.current = false;
      return;
    }
    goRoom(id);
  };

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
          onClear={() => setQuery("")}
        />
      </div>
      {filtered.length === 0 ? (
        <EmptyState icon="search" title="검색 결과가 없어요" />
      ) : (
        <ul className="divide-y divide-border bg-surface">
          {filtered.map((c) => {
            const name = c.title || "이름 없음";
            return (
              <li key={c.id}>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => handleRowClick(c.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      goRoom(c.id);
                    }
                  }}
                  onPointerDown={() => startPress(c)}
                  onPointerUp={cancelPress}
                  onPointerLeave={cancelPress}
                  onPointerCancel={cancelPress}
                  onContextMenu={(e) => e.preventDefault()}
                  className="flex cursor-pointer items-center gap-3 px-page py-3 active:bg-background-soft"
                >
                  <Avatar size="md" src={c.avatarUrl ?? undefined} alt={name} name={name} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-bold text-text-primary">
                      {name}
                      {c.type === "group" && (
                        <span className="ml-1 text-[13px] font-normal text-text-tertiary">
                          {c.memberCount}
                        </span>
                      )}
                    </p>
                    <p className="line-clamp-2 text-[13px] text-text-tertiary">
                      {c.lastMessageText ?? "대화를 시작해보세요"}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end justify-between self-stretch py-0.5">
                    <span className="text-[11px] text-text-tertiary">
                      {c.lastMessageAt ? timeAgo(c.lastMessageAt) : ""}
                    </span>
                    {c.unreadCount > 0 && (
                      <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-bold text-white">
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

      {/* 길게 누르기 → 가운데 액션 팝업 */}
      <Modal
        open={!!actionTarget}
        onOpenChange={(open) => !open && setActionTarget(null)}
        size="sm"
        showClose={false}
        title={actionTarget?.title ?? "대화"}
      >
        <div className="mt-1">
          <button
            type="button"
            onClick={() => {
              setConfirmTarget(actionTarget);
              setActionTarget(null);
            }}
            className="w-full rounded-lg py-2 text-left text-[15px] font-bold text-red-500 active:bg-background-soft"
          >
            나가기
          </button>
        </div>
      </Modal>

      {/* 나가기 확인 모달 */}
      <ConfirmDialog
        open={!!confirmTarget}
        onOpenChange={(open) => !open && setConfirmTarget(null)}
        title="채팅방 나가기"
        description="채팅방을 나가면 대화 내용이 삭제됩니다. 상대가 새 메시지를 보내면 다시 표시돼요."
        confirmLabel="나가기"
        cancelLabel="취소"
        loading={leave.isPending}
        onConfirm={() => {
          if (!confirmTarget) return;
          leave.mutate(confirmTarget.id, {
            onSuccess: () => setConfirmTarget(null),
          });
        }}
      />
    </div>
  );
};
