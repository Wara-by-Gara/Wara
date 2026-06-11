"use client";

import { useState } from "react";
import Image from "next/image";
import { Icon } from "@/components/icons";
import { Avatar } from "@/components/primitives/Avatar";
import { Button } from "@/components/primitives/Button";
import { ProfileSkeleton } from "@/components/organisms/Skeleton";
import { EmptyState } from "@/components/organisms/EmptyState";
import { ErrorState } from "@/components/organisms/ErrorState";
import { StickyHeader } from "@/components/layout/StickyHeader";
import { mockMe, type MockUser } from "@/lib/mockData";
import { mobileMainCenter } from "@/lib/mobilePageLayout";
import { PlaceLogPreview } from "./PlaceLogPreview";

export type MyPageState = "default" | "loggedOut" | "noProfile" | "loading" | "error";

export interface MyPageProps {
  state?: MyPageState;
  user?: MockUser;
  recentInvitations?: { id: string; title: string; date: string; imageUrl?: string }[];
  participatedCount?: number;
  hostedCount?: number;
  likeCount?: number;
  onInvitationClick?: (id: string) => void;
  onSettings?: () => void;
  onProfileEdit?: () => void;
  onPhotoMap?: (invitationId?: string) => void;
}

function StatItem({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-1 flex-col items-center gap-0.5">
      <span className="text-[15px] font-bold text-text-primary">{value}</span>
      <span className="text-[11px] text-text-tertiary">{label}</span>
    </div>
  );
}

export const MyPage = ({
  state = "default",
  user = mockMe,
  recentInvitations = [],
  participatedCount = 0,
  hostedCount = 0,
  likeCount = 0,
  onInvitationClick,
  onSettings,
  onProfileEdit,
  onPhotoMap,
}: MyPageProps) => {
  const [memoryIndex, setMemoryIndex] = useState(0);

  if (state === "loggedOut") {
    return (
      <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col overflow-x-hidden bg-background">
        <StickyHeader title="마이페이지" />
        <main className={`relative z-10 ${mobileMainCenter}`}>
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
      <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col overflow-x-hidden bg-background-soft">
        <StickyHeader title="마이페이지" />
        <main className="relative z-10 min-h-0 flex-1 overflow-y-auto">
          <ProfileSkeleton />
        </main>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col overflow-x-hidden bg-background">
        <StickyHeader title="마이페이지" />
        <main className={`relative z-10 ${mobileMainCenter}`}>
          <ErrorState title="프로필을 불러오지 못했어요" onRetry={() => {}} />
        </main>
      </div>
    );
  }

  const memory = recentInvitations.length > 0
    ? recentInvitations[memoryIndex % recentInvitations.length]
    : null;

  return (
    <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col overflow-x-hidden bg-background-soft">
      <StickyHeader
        title="마이페이지"
        rightSlot={
          <button
            type="button"
            aria-label="설정"
            onClick={onSettings}
            className="inline-flex size-11 items-center justify-center text-text-secondary"
          >
            <Icon name="settings" size="lg" color="currentColor" decorative />
          </button>
        }
      />
      <main className="relative z-10 min-h-0 flex-1 overflow-y-auto">
        <div className="flex flex-col gap-3 pb-6">

          {/* ── 프로필 — 투명 배경, 상단 aura 그라데이션이 비치게 ── */}
          <section className="px-page pb-5 pt-[85px]">
            <div className="flex flex-col items-center gap-3">
              <div className="relative shrink-0">
                <Avatar
                  size="xl"
                  src={state === "noProfile" ? undefined : user.avatarUrl}
                  alt={user.name ?? user.nickname}
                  name={user.name ?? user.nickname}
                  className="size-25 ring-4 ring-surface shadow-md"
                />
                <button
                  type="button"
                  aria-label="프로필 사진 변경"
                  onClick={onProfileEdit}
                  className="absolute -bottom-1 -right-1 flex size-7 items-center justify-center rounded-full bg-surface shadow-sm ring-2 ring-border"
                >
                  <Icon name="camera" size="xs" color="default" decorative />
                </button>
              </div>
              <div className="flex flex-col items-center gap-0.5 text-center">
                <span className="text-[18px] font-bold text-text-primary">
                  {user.name ?? user.nickname}
                </span>
                {user.nickname && (
                  <p className="text-[13px] text-text-tertiary">@{user.nickname}</p>
                )}
              </div>
            </div>

            {/* 통계 바 — 반투명 */}
            <div className="mt-4 flex divide-x divide-border rounded-2xl bg-surface/80 px-2 py-3 ring-1 ring-border/50 backdrop-blur-sm">
              <StatItem label="모임 참여" value={participatedCount} />
              <StatItem label="모임 개최" value={hostedCount} />
              <StatItem label="좋아요" value={likeCount} />
            </div>
          </section>

          {/* ── 랜덤 추억 모임 ── */}
          <div className="bg-surface px-4 py-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-[15px]">✨</span>
                <span className="text-[14px] font-bold text-text-primary">랜덤 추억 모임</span>
              </div>
              {recentInvitations.length > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    const cur = memoryIndex % recentInvitations.length;
                    let next = Math.floor(Math.random() * (recentInvitations.length - 1));
                    if (next >= cur) next += 1;
                    setMemoryIndex(next);
                  }}
                  className="flex items-center gap-1 text-[12px] font-medium text-text-tertiary active:opacity-60"
                >
                  <Icon name="rotate-cw" size="xs" color="inactive" decorative />
                  다른 추억 보기
                </button>
              )}
            </div>

            {memory ? (
              <button
                type="button"
                onClick={() => onInvitationClick?.(memory.id)}
                className="flex w-full items-center gap-3 rounded-2xl bg-background-soft p-3 text-left ring-1 ring-border active:opacity-80"
              >
                {memory.imageUrl && (
                  <div className="relative size-20 shrink-0 overflow-hidden rounded-xl">
                    <Image
                      src={memory.imageUrl}
                      alt={memory.title}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-bold text-text-primary">{memory.title}</p>
                  <div className="mt-1 flex items-center gap-1">
                    <Icon name="calendar" size="xs" color="inactive" decorative />
                    <span className="text-[11px] text-text-tertiary">{memory.date}</span>
                  </div>
                </div>
                <Icon name="chevron-right" size="sm" color="inactive" decorative />
              </button>
            ) : (
              <p className="py-4 text-center text-[13px] text-text-tertiary">추억 모임이 없어요</p>
            )}
          </div>

          {/* ── Place log ── */}
          <div className="bg-surface px-4 py-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-[15px]">📍</span>
                <span className="text-[14px] font-bold text-text-primary">Place log</span>
              </div>
              <button
                type="button"
                onClick={() => onPhotoMap?.(memory?.id)}
                className="flex items-center gap-0.5 text-[12px] font-medium text-text-tertiary active:opacity-60"
              >
                자세히 보기
                <Icon name="external-link" size="xs" color="inactive" decorative />
              </button>
            </div>
            <PlaceLogPreview invitationId={memory?.id} onViewAll={() => onPhotoMap?.(memory?.id)} />
          </div>

        </div>
      </main>
    </div>
  );
};
