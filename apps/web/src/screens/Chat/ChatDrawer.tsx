"use client";

import { Drawer } from "vaul";
import { Avatar } from "@/components/primitives/Avatar";
import { useMe } from "@/hooks/useUsers";
import {
  useConversationParticipants,
  useConversationPhotos,
} from "@/hooks/useChat";

// 채팅방 우측 슬라이딩 서랍 — 사진 갤러리 + 대화상대 목록 + 초대(준비 중)
export function ChatDrawer({
  open,
  onOpenChange,
  conversationId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversationId: string;
}) {
  const { data: me } = useMe();
  // 서랍 열릴 때만 조회 (enabled = open)
  const photos = useConversationPhotos(conversationId, open).data?.photos ?? [];
  const participants =
    useConversationParticipants(conversationId, open).data?.participants ?? [];

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange} direction="right">
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/48" />
        <Drawer.Content className="fixed inset-y-0 right-0 z-50 flex w-[85%] max-w-[360px] flex-col bg-surface focus:outline-none">
          <Drawer.Title className="px-page py-4 text-[18px] font-bold text-text-primary">
            메뉴
          </Drawer.Title>
          <div className="flex-1 overflow-y-auto px-page pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
            {/* 사진 갤러리 */}
            <section className="pb-6">
              <h3 className="mb-2 text-[14px] font-bold text-text-secondary">
                사진
              </h3>
              {photos.length === 0 ? (
                <p className="py-6 text-center text-[13px] text-text-tertiary">
                  주고받은 사진이 없어요
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-1">
                  {photos.map((p) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={p.messageId}
                      src={p.imageUrl}
                      alt="사진"
                      className="aspect-square w-full rounded-md object-cover"
                    />
                  ))}
                </div>
              )}
            </section>

            {/* 대화상대 */}
            <section>
              <h3 className="mb-2 text-[14px] font-bold text-text-secondary">
                대화상대 {participants.length}
              </h3>
              <ul className="flex flex-col">
                {participants.map((p) => (
                  <li key={p.userId} className="flex items-center gap-3 py-2">
                    <Avatar
                      size="sm"
                      src={p.avatarUrl ?? undefined}
                      name={p.name ?? undefined}
                    />
                    <span className="text-[15px] text-text-primary">
                      {p.name ?? "사용자"}
                      {p.userId === me?.id ? " (나)" : ""}
                    </span>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                disabled
                className="mt-3 w-full rounded-lg border border-border py-2.5 text-[14px] font-bold text-text-tertiary disabled:opacity-60"
              >
                초대하기 (준비 중)
              </button>
            </section>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
