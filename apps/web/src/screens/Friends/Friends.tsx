"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icons";
import { Avatar } from "@/components/primitives/Avatar";
import { SearchBar } from "@/components/molecules/SearchBar";
import { StickyHeader } from "@/components/layout/StickyHeader";
import { EmptyState } from "@/components/organisms/EmptyState";
import { toast } from "@/components/molecules/Toast";
import { mobileMainScroll, stickyMainTop } from "@/lib/mobilePageLayout";
import { ROUTES } from "@/constants/routes";
import { FriendsPageSkeleton } from "@/components/organisms/Skeleton";
import { useFriends } from "@/hooks/useFriends";

const DM_TOAST = "DM 기능은 곧 만나요";

export const Friends = () => {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const { friends, recentFriends, isLoading, isError, refetch } = useFriends();

  const keyword = query.trim();
  const filtered = keyword
    ? friends.filter((f) => f.name?.includes(keyword))
    : friends;

  const goDetail = (id: string) => router.push(ROUTES.FRIENDS.DETAIL(id));

  return (
    <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col overflow-x-hidden bg-background-soft">
      <StickyHeader title="친구" />
      <main className={`relative z-10 ${mobileMainScroll} ${stickyMainTop}`}>
        {isLoading ? (
          <FriendsPageSkeleton />
        ) : isError ? (
          <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-page">
            <EmptyState icon="users" title="친구 목록을 불러오지 못했어요" />
            <button
              type="button"
              onClick={() => refetch()}
              className="text-[14px] font-bold text-primary active:opacity-70"
            >
              다시 시도
            </button>
          </div>
        ) : friends.length === 0 ? (
          <div className="flex min-h-[60vh] flex-col items-center justify-center px-page">
            <EmptyState
              icon="users"
              title="아직 친구가 없어요"
              description="모임에 함께 참여하면 자동으로 친구가 돼요"
            />
          </div>
        ) : (
          <div className="flex flex-col gap-3 pb-6">
            {/* 최근 함께한 친구 — 스토리 형태 (그라데이션 링) */}
            <section className="pt-3">
              <h2 className="px-page pb-2 text-[14px] font-bold text-text-primary">최근 함께한 친구</h2>
              <div className="flex gap-5 overflow-x-auto overscroll-x-contain px-page pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {recentFriends.map((f) => {
                  const name = f.name ?? "이름 없음";
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => goDetail(f.id)}
                      className="flex w-20 shrink-0 flex-col items-center gap-1.5 active:opacity-70"
                    >
                      <span className="inline-flex rounded-full bg-gradient-to-tr from-primary via-pink-400 to-yellow-300 p-[2.5px]">
                        <span className="inline-flex rounded-full bg-background-soft p-[2px]">
                          <Avatar size="xl" src={f.avatarUrl ?? undefined} alt={name} initial={name[0]} />
                        </span>
                      </span>
                      <span className="w-full truncate text-center text-[12px] text-text-secondary">
                        {name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* 친구 목록 — 함께한 모임 많은 순 */}
            <section>
              <h2 className="px-page pb-1 text-[14px] font-bold text-text-primary">친구 {friends.length}</h2>
              <div className="px-page py-3">
                <SearchBar
                  placeholder="친구 이름으로 검색"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              {filtered.length === 0 ? (
                <EmptyState icon="search" title="검색 결과가 없어요" />
              ) : (
                <ul className="divide-y divide-border bg-surface">
                  {filtered.map((f) => {
                    const name = f.name ?? "이름 없음";
                    return (
                      <li key={f.id}>
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={() => goDetail(f.id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              goDetail(f.id);
                            }
                          }}
                          className="flex cursor-pointer items-center gap-3 px-page py-3 active:bg-background-soft"
                        >
                          <Avatar size="md" src={f.avatarUrl ?? undefined} alt={name} initial={name[0]} />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[15px] font-bold text-text-primary">{name}</p>
                            <p className="truncate text-[12px] text-text-tertiary">함께한 모임 {f.sharedCount}회</p>
                            <p className="mt-0.5 flex min-w-0 items-center gap-1 text-[12px] text-text-tertiary">
                              <Icon name="clock" size="sm" color="inactive" decorative />
                              <span className="truncate">{f.lastSharedTitle}</span>
                            </p>
                          </div>
                          <button
                            type="button"
                            aria-label={`${name}님에게 메시지`}
                            onClick={(e) => {
                              e.stopPropagation();
                              toast.show(DM_TOAST);
                            }}
                            className="inline-flex size-9 shrink-0 items-center justify-center rounded-full text-text-secondary active:bg-surface"
                          >
                            <Icon name="message-circle" size="sm" color="currentColor" decorative />
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
};
