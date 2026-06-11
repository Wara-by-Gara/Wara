"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Drawer } from "vaul";
import { Avatar } from "@/components/primitives/Avatar";
import {
  BottomSheet,
  BottomSheetContent,
} from "@/components/molecules/BottomSheet";
import { toast } from "@/components/molecules/Toast";
import { useMe } from "@/hooks/useUsers";
import { useFriends } from "@/hooks/useFriends";
import {
  useConversationParticipants,
  useConversationPhotos,
  useInvite,
} from "@/hooks/useChat";
import { ROUTES } from "@/constants/routes";

// 채팅방 우측 슬라이딩 서랍 — 사진 갤러리 + 대화상대 목록 + 초대
export function ChatDrawer({
  open,
  onOpenChange,
  conversationId,
  onPhotoClick,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversationId: string;
  onPhotoClick: (url: string) => void;
}) {
  const { data: me } = useMe();
  const [pickerOpen, setPickerOpen] = useState(false);
  // 서랍 열릴 때만 조회 (enabled = open)
  const photos = useConversationPhotos(conversationId, open).data?.photos ?? [];
  const participants =
    useConversationParticipants(conversationId, open).data?.participants ?? [];
  const memberIds = participants.map((p) => p.userId);

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
                    <button
                      key={p.messageId}
                      type="button"
                      onClick={() => onPhotoClick(p.imageUrl)}
                      className="aspect-square overflow-hidden rounded-md active:opacity-70"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.imageUrl}
                        alt="사진"
                        className="size-full object-cover"
                      />
                    </button>
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
                onClick={() => setPickerOpen(true)}
                className="mt-3 w-full rounded-lg border border-border py-2.5 text-[14px] font-bold text-text-secondary active:opacity-70"
              >
                초대하기
              </button>
            </section>
          </div>
        </Drawer.Content>
      </Drawer.Portal>

      {/* 친구 초대 시트 — 열릴 때만 친구 조회 */}
      <BottomSheet open={pickerOpen} onOpenChange={setPickerOpen}>
        <BottomSheetContent title="초대할 친구">
          <InvitePickerContent
            conversationId={conversationId}
            memberIds={memberIds}
            onDone={() => {
              setPickerOpen(false);
              onOpenChange(false);
            }}
          />
        </BottomSheetContent>
      </BottomSheet>
    </Drawer.Root>
  );
}

// 친구 멀티선택 -> 초대. 성공 시 반환된 대화방으로 이동.
function InvitePickerContent({
  conversationId,
  memberIds,
  onDone,
}: {
  conversationId: string;
  memberIds: string[];
  onDone: () => void;
}) {
  const router = useRouter();
  const invite = useInvite(conversationId);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const friends = useFriends().data?.friends ?? [];
  const memberSet = new Set(memberIds);
  // 이미 대화방에 있는 친구는 제외
  const candidates = friends.filter((f) => !memberSet.has(f.id));

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const handleInvite = () => {
    if (selected.size === 0) return;
    invite.mutate([...selected], {
      onSuccess: (res) => {
        onDone();
        router.push(ROUTES.CHAT.ROOM(res.conversationId));
      },
      onError: () => toast.error("초대하지 못했어요. 다시 시도해주세요"),
    });
  };

  return (
    <div>
      {candidates.length === 0 ? (
        <p className="py-6 text-center text-[13px] text-text-tertiary">
          초대할 수 있는 친구가 없어요
        </p>
      ) : (
        <ul className="flex max-h-[50vh] flex-col overflow-y-auto">
          {candidates.map((f) => {
            const name = f.name ?? "사용자";
            const checked = selected.has(f.id);
            return (
              <li key={f.id}>
                <button
                  type="button"
                  onClick={() => toggle(f.id)}
                  className="flex w-full items-center gap-3 py-2 active:opacity-70"
                >
                  <Avatar size="sm" src={f.avatarUrl ?? undefined} name={name} />
                  <span className="flex-1 text-left text-[15px] text-text-primary">
                    {name}
                  </span>
                  <span
                    className={`flex size-5 items-center justify-center rounded-full border ${
                      checked
                        ? "border-primary bg-primary text-text-inverse"
                        : "border-border"
                    }`}
                    aria-hidden
                  >
                    {checked ? "✓" : ""}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <button
        type="button"
        onClick={handleInvite}
        disabled={selected.size === 0 || invite.isPending}
        className="mt-4 w-full rounded-lg bg-primary py-3 text-[15px] font-bold text-text-inverse disabled:opacity-40"
      >
        {invite.isPending ? "초대 중..." : `초대${selected.size > 0 ? ` (${selected.size})` : ""}`}
      </button>
    </div>
  );
}
