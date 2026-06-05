"use client";

import { useRouter } from "next/navigation";
import { Avatar } from "@/components/primitives/Avatar";
import { Button } from "@/components/primitives/Button";
import { TopAppBar } from "@/components/molecules/TopAppBar";
import { InvitationCard } from "@/components/organisms/InvitationCard";
import { toast } from "@/components/molecules/Toast";
import { mobileMainScroll } from "@/lib/mobilePageLayout";
import { useFriendProfile } from "@/hooks/useFriends";

const DM_TOAST = "DM 기능은 곧 만나요";

function formatEventDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });
}

export interface FriendProfileProps {
  id: string;
}

export const FriendProfile = ({ id }: FriendProfileProps) => {
  const router = useRouter();
  const { data: friend, isLoading, isError } = useFriendProfile(id);

  if (isLoading) {
    return (
      <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col bg-background-soft">
        <TopAppBar className="absolute inset-x-0 top-0 z-30" title="친구" onBack={() => router.back()} />
        <main className={`${mobileMainScroll} pt-14`}>
          <p className="py-10 text-center text-text-tertiary">불러오는 중...</p>
        </main>
      </div>
    );
  }

  if (isError || !friend) {
    return (
      <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col bg-background-soft">
        <TopAppBar className="absolute inset-x-0 top-0 z-30" title="친구" onBack={() => router.back()} />
        <main className={`${mobileMainScroll} pt-14`}>
          <p className="py-10 text-center text-text-tertiary">친구 정보를 불러오지 못했어요</p>
        </main>
      </div>
    );
  }

  const name = friend.name ?? "이름 없음";

  return (
    <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col overflow-x-hidden bg-background-soft">
      <TopAppBar
        className="absolute inset-x-0 top-0 z-30"
        title={name}
        onBack={() => router.back()}
      />
      <main className={`${mobileMainScroll} pt-14`}>
        {/* 헤더 — 소프트 그라데이션 배경 */}
        <section className="flex flex-col items-center gap-3 bg-gradient-to-b from-primary-soft/40 to-surface px-5 pb-7 pt-8">
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
          <h2 className="px-5 pb-2 text-[14px] font-bold text-text-primary">
            함께 아는 친구 {friend.mutualFriends.length}
          </h2>
          <div className="flex gap-4 overflow-x-auto px-5">
            {friend.mutualFriends.map((m) => {
              const mName = m.name ?? "이름 없음";
              return (
                <div key={m.id} className="flex w-14 shrink-0 flex-col items-center gap-1.5">
                  <Avatar size="md" src={m.avatarUrl ?? undefined} alt={mName} initial={mName[0]} />
                  <span className="w-full truncate text-center text-[12px] text-text-secondary">
                    {mName}
                  </span>
                </div>
              );
            })}
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
                date={formatEventDate(inv.eventStartAt)}
                imageUrl={inv.imageUrl ?? undefined}
              />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};
