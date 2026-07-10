"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Icon, Avatar, Button, EmptyState, ErrorState } from "@wara/ui";
import { ProfileSkeleton } from "@/components/domain/Skeleton";
import { StickyHeader } from "@/components/layout/StickyHeader";
import { mobileMainCenter } from "@/lib/mobilePageLayout";
import { PlaceLogPreview } from "./PlaceLogPreview";
import { BadgesSection } from "@/domain/Profile/BadgesSection";

export type MyPageState = "default" | "loggedOut" | "noProfile" | "loading" | "error";

export interface UserData {
  id: string;
  name?: string;
  nickname: string;
  avatarUrl?: string;
  socialProvider?: "kakao" | "naver" | "apple";
  stats?: { created: number; joined: number };
}

export interface MyPageProps {
  state?: MyPageState;
  user?: UserData;
  recentInvitations?: { id: string; title: string; date: string; imageUrl?: string; eventLat?: number; eventLng?: number }[];
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
      <span className="text-[15px] font-bold text-text">{value}</span>
      <span className="text-[11px] text-text-disabled">{label}</span>
    </div>
  );
}

export const MyPage = ({
  state = "default",
  user,
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

  useEffect(() => {
    if (recentInvitations.length > 0) {
      setMemoryIndex(Math.floor(Math.random() * recentInvitations.length));
    }
  }, [recentInvitations.length]);

  if (state === "loggedOut") {
    return (
      <div className="relative mx-auto flex h-full min-h-dvh w-full max-w-md flex-col overflow-x-hidden bg-background lg:max-w-none">
        <StickyHeader />
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
      <div className="relative mx-auto flex h-full min-h-dvh w-full max-w-md flex-col overflow-x-hidden bg-surface-muted lg:max-w-none">
        <StickyHeader />
        <main className="relative z-10 min-h-0 flex-1 overflow-y-auto lg:mx-auto lg:w-full lg:max-w-5xl">
          <ProfileSkeleton />
        </main>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="relative mx-auto flex h-full min-h-dvh w-full max-w-md flex-col overflow-x-hidden bg-background lg:max-w-none">
        <StickyHeader />
        <main className={`relative z-10 ${mobileMainCenter}`}>
          <ErrorState title="프로필을 불러오지 못했어요" onRetry={() => {}} />
        </main>
      </div>
    );
  }

  if (!user) return null;

  const memory = recentInvitations.length > 0
    ? recentInvitations[memoryIndex % recentInvitations.length]
    : null;

  return (
    <div className="relative mx-auto flex h-full min-h-dvh w-full max-w-md flex-col overflow-x-hidden bg-surface-muted lg:max-w-none">
      <StickyHeader
        rightSlot={
          <button
            type="button"
            aria-label="설정"
            onClick={onSettings}
            className="inline-flex size-11 items-center justify-center text-text-muted"
          >
            <Icon name="settings" size="lg" color="currentColor" decorative />
          </button>
        }
      />
      <main className="relative z-10 min-h-0 flex-1 overflow-y-auto lg:mx-auto lg:w-full lg:max-w-5xl">
        <div className="flex flex-col gap-3 pb-6">

          {/* ── 프로필 — 투명 배경, 상단 aura 그라데이션이 비치게 ── */}
          <section className="px-page pb-5 pt-12">
            <div className="flex flex-col items-center gap-3">
              <div className="relative shrink-0">
                <Avatar
                  size="2xl"
                  src={state === "noProfile" ? undefined : user.avatarUrl}
                  alt={user.name ?? user.nickname}
                  name={user.name ?? user.nickname}
                  className="size-32 ring-4 ring-surface shadow-md"
                />
                <button
                  type="button"
                  aria-label="프로필 사진 변경"
                  onClick={onProfileEdit}
                  className="absolute -bottom-1 -right-1 flex size-11 items-center justify-center rounded-full bg-surface shadow-sm ring-2 ring-border"
                >
                  <Icon name="camera" size="xs" color="default" decorative />
                </button>
              </div>
              <div className="flex flex-col items-center gap-0.5 text-center">
                <span className="text-[18px] font-bold text-text">
                  {user.name ?? user.nickname}
                </span>
                {user.nickname && (
                  <p className="text-[13px] text-text-disabled">@{user.nickname}</p>
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
          <div className="bg-surface px-4 py-4 shadow-card">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-[15px]">✨</span>
                <span className="text-[14px] font-bold text-text">랜덤 추억 모임</span>
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
                  className="flex items-center gap-1 text-[12px] font-medium text-text-disabled active:opacity-60"
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
                className="flex w-full items-center gap-3 rounded-2xl bg-surface-muted p-3 text-left ring-1 ring-border active:opacity-80"
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
                  <p className="truncate text-[14px] font-bold text-text">{memory.title}</p>
                  <div className="mt-1 flex items-center gap-1">
                    <Icon name="calendar" size="xs" color="inactive" decorative />
                    <span className="text-[11px] text-text-disabled">{memory.date}</span>
                  </div>
                </div>
                <Icon name="chevron-right" size="sm" color="inactive" decorative />
              </button>
            ) : (
              <p className="py-4 text-center text-[13px] text-text-disabled">추억 모임이 없어요</p>
            )}
          </div>

          {/* ── Place log ── */}
          <div className="bg-surface px-4 py-4 shadow-card">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-[15px]">📍</span>
                <span className="text-[14px] font-bold text-text">Photo log</span>
              </div>
              <button
                type="button"
                onClick={() => onPhotoMap?.(memory?.id)}
                className="flex items-center gap-0.5 text-[12px] font-medium text-text-disabled active:opacity-60"
              >
                자세히 보기
                <Icon name="external-link" size="xs" color="inactive" decorative />
              </button>
            </div>
            <PlaceLogPreview
              key={memory?.id}
              invitationId={memory?.id}
              eventLat={memory?.eventLat}
              eventLng={memory?.eventLng}
              onViewAll={() => onPhotoMap?.(memory?.id)}
            />
          </div>

          {/* ── 업적 배지 ── */}
          <BadgesSection
            hosted={hostedCount}
            participated={participatedCount}
            likes={likeCount}
          />

        </div>
      </main>
    </div>
  );
};
