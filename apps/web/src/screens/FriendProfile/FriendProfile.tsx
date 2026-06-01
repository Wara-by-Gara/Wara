"use client";

import { useRouter } from "next/navigation";
import { Avatar } from "@/components/primitives/Avatar";
import { Button } from "@/components/primitives/Button";
import { TopAppBar } from "@/components/molecules/TopAppBar";
import { InvitationCard } from "@/components/organisms/InvitationCard";
import { toast } from "@/components/molecules/Toast";
import { mobileMainScroll } from "@/lib/mobilePageLayout";
import { getMockFriendProfile, type MockFriendProfile } from "@/lib/mockData";

const DM_TOAST = "DM 기능은 곧 만나요";

export interface FriendProfileProps {
  friend?: MockFriendProfile;
}

export const FriendProfile = ({ friend = getMockFriendProfile("p2") }: FriendProfileProps) => {
  const router = useRouter();

  return (
    <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col overflow-x-hidden bg-background-soft">
      <TopAppBar
        className="absolute inset-x-0 top-0 z-30"
        title={friend.name}
        onBack={() => router.back()}
      />
      <main className={`${mobileMainScroll} pt-14`}>
        {/* 헤더 — 소프트 그라데이션 배경 */}
        <section className="flex flex-col items-center gap-3 bg-gradient-to-b from-primary-soft/40 to-surface px-5 pb-7 pt-8">
          <Avatar
            size="xl"
            src={friend.avatarUrl}
            alt={friend.name}
            initial={friend.name[0]}
            className="size-24"
          />
          <div className="flex flex-col items-center gap-0.5">
            <p className="font-gmarket text-[20px] font-medium text-text-primary">{friend.name}</p>
            <p className="text-[13px] text-text-tertiary">함께한 모임 {friend.sharedCount}회</p>
          </div>
          <Button variant="secondary" fullWidth onClick={() => toast.show(DM_TOAST)} className="mt-1">
            메시지 보내기
          </Button>
        </section>

        {/* 함께 아는 친구 */}
        <section className="py-4">
          <h2 className="px-5 pb-2 text-[14px] font-bold text-text-primary">
            함께 아는 친구 {friend.mutualFriends.length}
          </h2>
          <div className="flex gap-4 overflow-x-auto px-5">
            {friend.mutualFriends.map((m) => (
              <div key={m.id} className="flex w-14 shrink-0 flex-col items-center gap-1.5">
                <Avatar size="md" src={m.avatarUrl} alt={m.name} initial={m.name[0]} />
                <span className="w-full truncate text-center text-[12px] text-text-secondary">
                  {m.name}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* 함께 참여했던 초대 */}
        <section className="py-2 pb-8">
          <h2 className="px-5 pb-2 text-[14px] font-bold text-text-primary">함께 참여했던 초대</h2>
          <div className="grid grid-cols-2 gap-3 px-5">
            {friend.sharedInvitations.map((inv) => (
              <InvitationCard
                key={inv.id}
                variant="invited"
                title={inv.title}
                date={inv.date}
                imageUrl={inv.imageUrl}
              />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};
