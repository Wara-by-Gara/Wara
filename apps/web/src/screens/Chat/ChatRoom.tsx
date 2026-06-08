"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/primitives/Avatar";
import { TopAppBar } from "@/components/molecules/TopAppBar";
import { useMe } from "@/hooks/useUsers";
import {
  useConversation,
  useChatMessages,
  useSendMessage,
  useChatRealtime,
} from "@/hooks/useChat";

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("ko-KR", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export interface ChatRoomProps {
  id: string;
}

export const ChatRoom = ({ id }: ChatRoomProps) => {
  const router = useRouter();
  const { data: me } = useMe();
  const myId = me?.id;
  const { data: conversation } = useConversation(id);
  const { messages, hasNextPage, fetchNextPage, isFetchingNextPage, isLoading } =
    useChatMessages(id);
  const sendMutation = useSendMessage(id);
  useChatRealtime(id);

  const [text, setText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const partnerName = conversation?.partner?.name ?? "상대";
  const partnerReadAt = conversation?.partnerLastReadAt
    ? new Date(conversation.partnerLastReadAt).getTime()
    : null;

  // 새 메시지/입장 시 맨 아래로 스크롤
  const lastMessageId = messages[messages.length - 1]?.id;
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lastMessageId]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const content = text.trim();
    if (!content || sendMutation.isPending) return;
    sendMutation.mutate(content);
    setText("");
  };

  return (
    <div className="mx-auto flex h-dvh w-full max-w-md flex-col bg-background-soft">
      <TopAppBar
        onBack={() => router.back()}
        title={
          <span className="flex items-center justify-center gap-2">
            <Avatar
              size="xs"
              src={conversation?.partner?.avatarUrl ?? undefined}
              alt={partnerName}
              initial={partnerName[0]}
            />
            <span className="truncate text-[16px] font-bold text-text-primary">
              {partnerName}
            </span>
          </span>
        }
      />

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-page">
        {hasNextPage && (
          <div className="flex justify-center py-3">
            <button
              type="button"
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="text-[13px] text-text-tertiary active:opacity-70"
            >
              {isFetchingNextPage ? "불러오는 중…" : "이전 메시지 보기"}
            </button>
          </div>
        )}

        {isLoading ? (
          <p className="py-10 text-center text-[14px] text-text-tertiary">불러오는 중…</p>
        ) : messages.length === 0 ? (
          <p className="py-10 text-center text-[14px] text-text-tertiary">
            첫 메시지를 보내보세요
          </p>
        ) : (
          <ul className="flex flex-col gap-2 py-3">
            {messages.map((m, i) => {
              const mine = m.senderId === myId;
              const unread =
                mine && (partnerReadAt === null || new Date(m.createdAt).getTime() > partnerReadAt);
              // 연속 그룹의 첫 메시지 (보낸 사람이 바뀌는 지점)
              const firstOfGroup = messages[i - 1]?.senderId !== m.senderId;
              // 상대 메시지의 첫 번째에만 프로필 표시
              const showAvatar = !mine && firstOfGroup;
              // 각 그룹 첫 말풍선은 자기 쪽으로 꼬리(tail) 표시
              const bubbleClass = mine
                ? firstOfGroup
                  ? "rounded-tr-sm bg-primary text-text-inverse before:absolute before:-right-[5px] before:top-2.5 before:size-0 before:border-y-[6px] before:border-l-[7px] before:border-y-transparent before:border-l-primary before:content-['']"
                  : "rounded-br-sm bg-primary text-text-inverse"
                : showAvatar
                  ? "rounded-tl-sm bg-surface text-text-primary before:absolute before:-left-[5px] before:top-2.5 before:size-0 before:border-y-[6px] before:border-r-[7px] before:border-y-transparent before:border-r-surface before:content-['']"
                  : "rounded-bl-sm bg-surface text-text-primary";
              return (
                <li
                  key={m.id}
                  className={`flex items-end gap-1.5 ${mine ? "flex-row-reverse" : "flex-row"}`}
                >
                  {!mine &&
                    (showAvatar ? (
                      <Avatar
                        size="sm"
                        src={conversation?.partner?.avatarUrl ?? undefined}
                        alt={partnerName}
                        initial={partnerName[0]}
                        className="self-start"
                      />
                    ) : (
                      <span className="w-9 shrink-0" aria-hidden />
                    ))}
                  <div
                    className={`relative max-w-[72%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-[15px] ${bubbleClass}`}
                  >
                    {m.content}
                  </div>
                  <div className="flex shrink-0 flex-col items-end justify-end leading-none">
                    {unread && (
                      <span className="mb-0.5 text-[11px] font-bold text-primary">1</span>
                    )}
                    <span className="text-[10px] text-text-tertiary">
                      {formatTime(m.createdAt)}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <form
        onSubmit={handleSend}
        className="flex shrink-0 items-center gap-2 border-t border-border bg-surface px-3 py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]"
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="메시지를 입력하세요"
          className="h-10 flex-1 rounded-full bg-background-soft px-4 text-[15px] text-text-primary outline-none placeholder:text-text-tertiary"
        />
        <button
          type="submit"
          aria-label="전송"
          disabled={!text.trim() || sendMutation.isPending}
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-text-inverse transition-opacity disabled:opacity-40"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M12 19V5M12 5l-6 6M12 5l6 6"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </form>
    </div>
  );
};
