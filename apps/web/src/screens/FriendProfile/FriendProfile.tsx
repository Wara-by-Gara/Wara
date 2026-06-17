"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon, Avatar, Button, TopAppBar } from "@wara/ui";
import { InviteCard, statusChipToBadge } from "@/components/domain";
import { HeaderGradient } from "@/components/layout/StickyHeader";
import { ParticipantProfileModal } from "@/components/domain";
import { useMutation } from "@tanstack/react-query";
import { createConversation } from "@/lib/api/conversations";
import { ROUTES } from "@/constants/routes";
import { resolveInvitationCardStatus } from "@/utils/resolveInvitationCardStatus";
import { mobileMainScroll, stickyMainTop } from "@/lib/mobilePageLayout";
import { FriendProfilePageSkeleton } from "@/components/domain/Skeleton";
import { useFriendProfile } from "@/hooks/useFriends";
import type { MutualFriend } from "@/lib/api/friends";
import { formatInvitationEventDate } from "@/utils/formatInvitationEventDate";

export interface FriendProfileProps {
  id: string;
}

export const FriendProfile = ({ id }: FriendProfileProps) => {
  const router = useRouter();
  const { data: friend, isLoading, isError } = useFriendProfile(id);
  const [selectedMutualFriend, setSelectedMutualFriend] = useState<MutualFriend | null>(null);

  const startChat = useMutation({
    mutationFn: (targetUserId: string) => createConversation(targetUserId),
    onSuccess: (data) => router.push(ROUTES.CHAT.ROOM(data.id)),
  });

  if (isLoading) {
    return (
      <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col bg-surface-muted">
        <HeaderGradient fixed />
        <TopAppBar className="absolute inset-x-0 top-0 z-30" title="친구" onBack={() => router.back()} />
        <main className={`relative z-10 ${mobileMainScroll} ${stickyMainTop}`}>
          <FriendProfilePageSkeleton />
        </main>
      </div>
    );
  }

  if (isError || !friend) {
    return (
      <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col bg-surface-muted">
        <HeaderGradient fixed />
        <TopAppBar className="absolute inset-x-0 top-0 z-30" title="친구" onBack={() => router.back()} />
        <main className={`relative z-10 ${mobileMainScroll} ${stickyMainTop}`}>
          <p className="py-10 text-center text-text-disabled">친구 정보를 불러오지 못했어요</p>
        </main>
      </div>
    );
  }

  const name = friend.name ?? "이름 없음";

  return (
    <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col overflow-x-hidden bg-surface-muted">
      <HeaderGradient fixed />
      <TopAppBar
        variant="transparent"
        className="absolute inset-x-0 top-0 z-30 min-h-0 pt-2"
        onBack={() => router.back()}
      />
      <main className={`relative z-10 ${mobileMainScroll}`}>
        {/* 프로필 헤더 - 배경 투명으로 두어 상단 aura 그라데이션(HeaderGradient)이 비치게, 위 여백 축소 */}
        <section className="flex flex-col items-center gap-3 px-page pb-7 pt-14">
          <Avatar
            size="xl"
            src={friend.avatarUrl ?? undefined}
            alt={name}
            name={name}
            className="size-24"
          />
          <div className="flex flex-col items-center gap-0.5">
            <p className="font-gmarket text-[20px] font-medium text-text">{name}</p>
            <p className="text-[13px] text-text-disabled">함께한 모임 {friend.sharedCount}회</p>
          </div>
          <Button
            variant="secondary"
            fullWidth
            onClick={() => startChat.mutate(id)}
            disabled={startChat.isPending}
            className="mt-1 rounded-lg border border-border-strong bg-surface/40 backdrop-blur-sm hover:bg-surface/60 active:bg-surface/70"
          >
            <Icon name="message-circle" size="sm" color="currentColor" decorative />
            1:1 채팅
          </Button>
        </section>

        {/* 함께 아는 친구 */}
        <section className="py-4">
          <h2 className="px-page pb-2 text-[14px] font-bold text-text">
            함께 아는 친구 {friend.mutualFriends.length}
          </h2>
          <div className="flex gap-3 overflow-x-auto px-page">
            {friend.mutualFriends.map((m) => {
              const mName = m.name ?? "이름 없음";
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedMutualFriend(m)}
                  className="flex w-14 shrink-0 flex-col items-center gap-1.5 active:opacity-70"
                >
                  <Avatar size="md" src={m.avatarUrl ?? undefined} alt={mName} name={mName} />
                  <span className="w-full truncate text-center text-[12px] text-text-muted">
                    {mName}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* 함께한 초대 */}
        <section className="py-2 pb-8">
          <h2 className="px-page pb-2 text-[14px] font-bold text-text">함께한 초대</h2>
          <div className="grid grid-cols-2 gap-3 px-page">
            {friend.sharedInvitations.map((inv) => {
              const chip = resolveInvitationCardStatus({
                eventStartAt: inv.eventStartAt,
                status: inv.status,
                isHostedByMe: inv.isHostedByMe,
              });

              return (
                <InviteCard
                  key={inv.id}
                  badge={statusChipToBadge(chip)}
                  title={inv.title}
                  dateText={formatInvitationEventDate(inv.eventStartAt, "")}
                  imageUrl={inv.imageUrl ?? undefined}
                  onClick={() => router.push(ROUTES.INVITATIONS.DETAIL(inv.id))}
                />
              );
            })}
          </div>
        </section>
      </main>

      {selectedMutualFriend ? (
        <ParticipantProfileModal
          open={!!selectedMutualFriend}
          onOpenChange={(open) => {
            if (!open) setSelectedMutualFriend(null);
          }}
          userId={selectedMutualFriend.id}
          name={selectedMutualFriend.name ?? undefined}
          avatarUrl={selectedMutualFriend.avatarUrl ?? undefined}
        />
      ) : null}
    </div>
  );
};
