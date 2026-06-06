"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/primitives/Avatar";
import { Button } from "@/components/primitives/Button";
import { HeaderGradient } from "@/components/layout/StickyHeader";
import { TopAppBar } from "@/components/molecules/TopAppBar";
import { InvitationCard } from "@/components/organisms/InvitationCard";
import { ParticipantProfileModal } from "@/components/organisms/ParticipantProfileModal/ParticipantProfileModal";
import { toast } from "@/components/molecules/Toast";
import { ROUTES } from "@/constants/routes";
import { resolveInvitationCardStatus } from "@/utils/resolveInvitationCardStatus";
import { mobileMainScroll, stickyMainTop } from "@/lib/mobilePageLayout";
import { FriendProfilePageSkeleton } from "@/components/organisms/Skeleton";
import { useFriendProfile } from "@/hooks/useFriends";
import type { MutualFriend } from "@/lib/api/friends";
import { formatInvitationEventDate } from "@/utils/formatInvitationEventDate";

const DM_TOAST = "DM 기능은 곧 만나요";

export interface FriendProfileProps {
  id: string;
}

export const FriendProfile = ({ id }: FriendProfileProps) => {
  const router = useRouter();
  const { data: friend, isLoading, isError } = useFriendProfile(id);
  const [selectedMutualFriend, setSelectedMutualFriend] = useState<MutualFriend | null>(null);

  if (isLoading) {
    return (
      <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col bg-background-soft">
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
      <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col bg-background-soft">
        <HeaderGradient fixed />
        <TopAppBar className="absolute inset-x-0 top-0 z-30" title="친구" onBack={() => router.back()} />
        <main className={`relative z-10 ${mobileMainScroll} ${stickyMainTop}`}>
          <p className="py-10 text-center text-text-tertiary">친구 정보를 불러오지 못했어요</p>
        </main>
      </div>
    );
  }

  const name = friend.name ?? "이름 없음";

  return (
    <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col overflow-x-hidden bg-background-soft">
      <HeaderGradient fixed />
      <TopAppBar
        className="absolute inset-x-0 top-0 z-30"
        title={name}
        onBack={() => router.back()}
      />
      <main className={`relative z-10 ${mobileMainScroll} ${stickyMainTop}`}>
        {/* 헤더 — 소프트 그라데이션 배경 */}
        <section className="flex flex-col items-center gap-3 bg-gradient-to-b from-primary-soft/40 to-surface px-page pb-7 pt-8">
          <Avatar
            size="xl"
            src={friend.avatarUrl ?? undefined}
            alt={name}
            initial={name[0]}
            className="size-24"
          />
          <div className="flex flex-col items-center gap-0.5">
            <p className="font-gmarket text-[20px] font-medium text-text-primary">{name}</p>
            <p className="text-[13px] text-text-tertiary">함께한 모임 {friend.sharedCount}회</p>
          </div>
          <Button variant="secondary" fullWidth onClick={() => toast.show(DM_TOAST)} className="mt-1">
            메시지 보내기
          </Button>
        </section>

        {/* 함께 아는 친구 */}
        <section className="py-4">
          <h2 className="px-page pb-2 text-[14px] font-bold text-text-primary">
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
                  <Avatar size="md" src={m.avatarUrl ?? undefined} alt={mName} initial={mName[0]} />
                  <span className="w-full truncate text-center text-[12px] text-text-secondary">
                    {mName}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* 함께한 초대 */}
        <section className="py-2 pb-8">
          <h2 className="px-page pb-2 text-[14px] font-bold text-text-primary">함께한 초대</h2>
          <div className="grid grid-cols-2 gap-3 px-page">
            {friend.sharedInvitations.map((inv) => {
              const chip = resolveInvitationCardStatus({
                eventStartAt: inv.eventStartAt,
                status: inv.status,
                isHostedByMe: inv.isHostedByMe,
              });

              return (
                <InvitationCard
                  key={inv.id}
                  variant={chip?.variant ?? "default"}
                  ddayLabel={chip?.ddayLabel}
                  title={inv.title}
                  date={formatInvitationEventDate(inv.eventStartAt, "")}
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
          onDm={() => toast.show(DM_TOAST)}
        />
      ) : null}
    </div>
  );
};
