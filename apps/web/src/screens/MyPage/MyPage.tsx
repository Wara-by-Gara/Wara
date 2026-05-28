"use client";

import { Icon } from "@/components/icons";
import { Avatar } from "@/components/primitives/Avatar";
import { Button } from "@/components/primitives/Button";
import { InvitationCard, type InvitationCardVariant } from "@/components/organisms/InvitationCard";
import { ProfileSkeleton } from "@/components/organisms/Skeleton";
import { EmptyState } from "@/components/organisms/EmptyState";
import { ErrorState } from "@/components/organisms/ErrorState";
import { MenuItem } from "@/components/molecules/MenuItem";
import { TopAppBar } from "@/components/molecules/TopAppBar";
import { mockMe, type MockUser } from "@/lib/mockData";
import { mobileMainCenter } from "@/lib/mobilePageLayout";

export type MyPageState = "default" | "loggedOut" | "noProfile" | "loading" | "error";

export interface MyPageProps {
  state?: MyPageState;
  user?: MockUser;
  /** 최근/내가 만든/참여한 — props로 주입 */
  recentInvitations?: { id: string; title: string; date: string; imageUrl?: string; variant?: InvitationCardVariant }[];
  onProfileEdit?: () => void;
  onAccount?: () => void;
  onSupport?: () => void;
}

export const MyPage = ({
  state = "default",
  user = mockMe,
  recentInvitations = [],
  onProfileEdit,
  onAccount,
  onSupport,
}: MyPageProps) => {
  if (state === "loggedOut") {
    return (
      <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col overflow-x-hidden bg-background">
        <TopAppBar className="shrink-0" title="마이페이지" />
        <main className={mobileMainCenter}>
          <EmptyState
            icon="user-round-cog"
            title="로그인이 필요해요"
            description="로그인하면 내 초대장과 응답을 한곳에서 볼 수 있어요"
            action={<Button>로그인</Button>}
          />
        </main>
      </div>
    );
  }

  if (state === "loading") {
    return (
      <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col overflow-x-hidden bg-background">
        <TopAppBar className="shrink-0" title="마이페이지" />
        <main className="min-h-0 flex-1 overflow-y-auto px-5 py-6">
          <ProfileSkeleton />
        </main>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col overflow-x-hidden bg-background">
        <TopAppBar className="shrink-0" title="마이페이지" />
        <main className={mobileMainCenter}>
          <ErrorState title="프로필을 불러오지 못했어요" onRetry={() => {}} />
        </main>
      </div>
    );
  }

  return (
    <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col overflow-x-hidden bg-background-soft">
      <TopAppBar className="shrink-0" title="마이페이지" />
      <main className="min-h-0 flex-1 overflow-y-auto">
      <section className="flex flex-col items-center gap-3 bg-surface py-8">
        <Avatar
          size="xl"
          src={state === "noProfile" ? undefined : user.avatarUrl}
          alt={user.name ?? user.nickname}
          initial={(user.name ?? user.nickname)[0]}
          className="size-20"
        />
        <div className="flex flex-col items-center gap-0.5">
          <p className="text-[18px] font-bold text-text-primary">{user.name ?? user.nickname}</p>
          {user.name && user.nickname ? (
            <p className="text-[14px] font-normal text-text-tertiary">@{user.nickname}</p>
          ) : null}
        </div>
        <Button variant="outline" size="sm" onClick={onProfileEdit}>프로필 수정</Button>
        {user.stats ? (
          <div className="mt-3 grid w-full grid-cols-2 border-t border-border pt-4">
            <div className="flex flex-col items-center gap-0.5 border-r border-border">
              <span className="text-[24px] font-extrabold tabular-nums text-primary">
                {user.stats.created}
              </span>
              <span className="text-[12px] text-text-tertiary">내가 만든</span>
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-[24px] font-extrabold tabular-nums text-sky-500">
                {user.stats.joined}
              </span>
              <span className="text-[12px] text-text-tertiary">참여한</span>
            </div>
          </div>
        ) : null}
      </section>

      <section className="py-3">
        <h2 className="px-5 py-2 text-[14px] font-bold text-text-primary">최근 초대장</h2>
        {recentInvitations.length === 0 ? (
          <p className="px-5 py-6 text-center text-[13px] text-text-tertiary">최근 초대장이 없어요</p>
        ) : (
          <div className="flex gap-3 overflow-x-auto px-5">
            {recentInvitations.map((inv) => (
              <div key={inv.id} className="w-56 shrink-0">
                <InvitationCard
                  variant={inv.variant ?? "default"}
                  title={inv.title}
                  date={inv.date}
                  imageUrl={inv.imageUrl}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="py-2">
        <div className="divide-y divide-border bg-surface">
          <MenuItem leftIcon="user-round-cog" onClick={onAccount} rightSlot={<Icon name="chevron-right" size="sm" color="inactive" decorative />}>계정 관리</MenuItem>
          <MenuItem leftIcon="help-circle" onClick={onSupport} rightSlot={<Icon name="chevron-right" size="sm" color="inactive" decorative />}>고객센터</MenuItem>
        </div>
      </section>
      </main>
    </div>
  );
};
