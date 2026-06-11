"use client";

import { useState } from "react";
import { Icon } from "@/components/icons";
import { Avatar } from "@/components/primitives/Avatar";
import { Button } from "@/components/primitives/Button";
import { InvitationCard, type InvitationCardVariant } from "@/components/organisms/InvitationCard";
import { ProfileSkeleton } from "@/components/organisms/Skeleton";
import { EmptyState } from "@/components/organisms/EmptyState";
import { ErrorState } from "@/components/organisms/ErrorState";
import { MenuItem } from "@/components/molecules/MenuItem";
import { StickyHeader } from "@/components/layout/StickyHeader";
import { mockMe, type MockUser } from "@/lib/mockData";
import { mobileMainCenter } from "@/lib/mobilePageLayout";

export type MyPageState = "default" | "loggedOut" | "noProfile" | "loading" | "error";

// 최근 초대장 기본 노출 개수 (나머지는 '더보기'로 펼침)
const RECENT_PREVIEW = 4;

export interface MyPageProps {
  state?: MyPageState;
  user?: MockUser;
  /** 최근/내가 만든/참여한 - props로 주입 */
  recentInvitations?: { id: string; title: string; date: string; imageUrl?: string; variant?: InvitationCardVariant }[];
  /** 총 참여한 모임 수 */
  participatedCount?: number;
  onInvitationClick?: (id: string) => void;
  onSettings?: () => void;
  onProfileEdit?: () => void;
  onInquiries?: () => void;
  onAccount?: () => void;
  onSupport?: () => void;
  onHiddenFriends?: () => void;
  onHiddenInvitations?: () => void;
  onPhotoMap?: () => void;
}

export const MyPage = ({
  state = "default",
  user = mockMe,
  recentInvitations = [],
  participatedCount = 0,
  onInvitationClick,
  onSettings,
  onProfileEdit,
  onInquiries,
  onAccount,
  onSupport,
  onHiddenFriends,
  onHiddenInvitations,
  onPhotoMap,
}: MyPageProps) => {
  const [recentExpanded, setRecentExpanded] = useState(false);
  const shownInvitations = recentExpanded
    ? recentInvitations
    : recentInvitations.slice(0, RECENT_PREVIEW);

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
      <main className="relative z-10 min-h-0 flex-1 overflow-y-auto pb-10">
      {/* 프로필 히어로 - 배경 투명, 상단 aura 그라데이션이 비치게 */}
      <section className="flex flex-col items-center gap-4 pb-7 pt-[108px]">
        <div className="relative">
          <Avatar
            size="xl"
            src={state === "noProfile" ? undefined : user.avatarUrl}
            alt={user.name ?? user.nickname}
            name={user.name ?? user.nickname}
            className="size-28 shadow-md ring-4 ring-surface"
          />
          <button
            type="button"
            aria-label="프로필 사진 변경"
            onClick={onProfileEdit}
            className="absolute bottom-1 right-1 inline-flex size-9 items-center justify-center rounded-full bg-surface shadow-sm ring-2 ring-surface"
          >
            <Icon name="camera" size="sm" color="primary" decorative />
          </button>
        </div>
        <div className="flex flex-col items-center gap-0.5 text-center">
          <p className="text-[22px] font-bold text-text-primary">{user.name ?? user.nickname}</p>
          {user.name && user.nickname ? (
            <p className="text-[14px] text-text-tertiary">@{user.nickname}</p>
          ) : null}
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-surface/80 px-3.5 py-1.5 shadow-sm ring-1 ring-border backdrop-blur-sm">
          <Icon name="users-round" size="sm" color="primary" decorative />
          <span className="text-[13px] text-text-secondary">
            참여한 모임 <span className="font-bold text-text-primary">{participatedCount}</span>
          </span>
        </div>
      </section>

      <section className="px-page pt-1">
        <h2 className="mb-2 px-1 text-[15px] font-bold text-text-primary">최근 초대장</h2>
        {recentInvitations.length === 0 ? (
          <div className="rounded-2xl bg-surface py-8 text-center text-[13px] text-text-tertiary shadow-sm ring-1 ring-border">
            최근 초대장이 없어요
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              {shownInvitations.map((inv) => (
                <InvitationCard
                  key={inv.id}
                  variant={inv.variant ?? "default"}
                  title={inv.title}
                  date={inv.date}
                  dateClassName="text-[11px]"
                  imageUrl={inv.imageUrl}
                  onClick={onInvitationClick ? () => onInvitationClick(inv.id) : undefined}
                />
              ))}
            </div>
            {recentInvitations.length > RECENT_PREVIEW && (
              <button
                type="button"
                onClick={() => setRecentExpanded((v) => !v)}
                className="mt-3 flex w-full items-center justify-center gap-1 rounded-2xl bg-surface py-2.5 text-[13px] font-bold text-text-secondary shadow-sm ring-1 ring-border active:opacity-70"
              >
                {recentExpanded ? "접기" : `더보기 (${recentInvitations.length - RECENT_PREVIEW})`}
                <span className={`inline-flex transition-transform ${recentExpanded ? "rotate-180" : ""}`}>
                  <Icon name="chevron-down" size="sm" color="inactive" decorative />
                </span>
              </button>
            )}
          </>
        )}
      </section>

      <section className="px-page pt-5">
        <div className="overflow-hidden rounded-2xl bg-surface shadow-sm ring-1 ring-border">
          <div className="divide-y divide-border">
            <MenuItem
              leftIcon="map-pin"
              onClick={onPhotoMap}
              rightSlot={<Icon name="chevron-right" size="sm" color="inactive" decorative />}
            >
              Place log
            </MenuItem>
            <MenuItem
              leftIcon="user-x"
              onClick={onHiddenFriends}
              rightSlot={<Icon name="chevron-right" size="sm" color="inactive" decorative />}
            >
              삭제한 친구
            </MenuItem>
            <MenuItem
              leftIcon="eye-off"
              onClick={onHiddenInvitations}
              rightSlot={<Icon name="chevron-right" size="sm" color="inactive" decorative />}
            >
              숨긴 초대장
            </MenuItem>
            <MenuItem
              leftIcon="message-circle"
              onClick={onInquiries}
              rightSlot={<Icon name="chevron-right" size="sm" color="inactive" decorative />}
            >
              문의하기
            </MenuItem>
            <MenuItem leftIcon="user-round-cog" onClick={onAccount} rightSlot={<Icon name="chevron-right" size="sm" color="inactive" decorative />}>계정 관리</MenuItem>
            <MenuItem leftIcon="help-circle" onClick={onSupport} rightSlot={<Icon name="chevron-right" size="sm" color="inactive" decorative />}>고객센터</MenuItem>
          </div>
        </div>
      </section>
      </main>
    </div>
  );
};
