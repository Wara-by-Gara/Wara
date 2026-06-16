"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icons";
import { Avatar, EmptyState, SearchBar, Modal, ConfirmDialog } from "@wara/ui";
import { ROUTES } from "@/constants/routes";
import { FriendsPageSkeleton } from "@/components/organisms/Skeleton";
import { useFriends, useHideFriend } from "@/hooks/useFriends";
import type { Friend } from "@/lib/api/friends";
import { FriendsIndexBar } from "./FriendsIndexBar";
import { buildIndexLetters, compareByInitial, getInitial, matchName } from "./initials";

type SortBy = "name" | "shared";
const LONG_PRESS_MS = 500;

export const FriendsList = () => {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("name");
  const { friends, recentFriends, isLoading, isError, refetch } = useFriends();

  const keyword = query.trim();

  // 가나다순(한글→영문→#) 또는 함께한 모임 많은 순
  const sorted = useMemo(() => {
    const arr = [...friends];
    if (sortBy === "shared") {
      arr.sort(
        (a, b) => b.sharedCount - a.sharedCount || compareByInitial(a.name, b.name),
      );
    } else {
      arr.sort((a, b) => compareByInitial(a.name, b.name));
    }
    return arr;
  }, [friends, sortBy]);
  const filtered = keyword
    ? sorted.filter((f) => matchName(f.name, keyword))
    : sorted;

  // 가나다순 + 검색 중이 아닐 때만 초성 인덱스 바 노출
  const showIndex = sortBy === "name" && !keyword && filtered.length > 0;
  const presentInitials = useMemo(
    () => new Set(sorted.map((f) => getInitial(f.name))),
    [sorted],
  );
  const indexLetters = useMemo(
    () => buildIndexLetters(presentInitials),
    [presentInitials],
  );

  const goDetail = (id: string) => router.push(ROUTES.FRIENDS.DETAIL(id));

  const jumpToInitial = (letter: string) => {
    document.getElementById(`fr-init-${letter}`)?.scrollIntoView({ block: "start" });
  };

  // 길게 눌러 삭제 — 액션 시트 → 확인 모달
  const [actionTarget, setActionTarget] = useState<Friend | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<Friend | null>(null);
  const hideFriend = useHideFriend();
  const pressTimer = useRef<number | null>(null);
  const longPressed = useRef(false);

  const startPress = (friend: Friend) => {
    longPressed.current = false;
    pressTimer.current = window.setTimeout(() => {
      longPressed.current = true;
      setActionTarget(friend);
    }, LONG_PRESS_MS);
  };
  const cancelPress = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };
  const handleRowClick = (friend: Friend) => {
    if (longPressed.current) {
      longPressed.current = false;
      return;
    }
    goDetail(friend.id);
  };

  if (isLoading) return <FriendsPageSkeleton />;

  if (isError) {
    return (
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
    );
  }

  if (friends.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-page">
        <EmptyState
          icon="users"
          title="아직 친구가 없어요"
          description="모임에 함께 참여하면 자동으로 친구가 돼요"
        />
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-3 pb-6">
        {/* 최근 함께한 친구 — 스토리 형태 (그라데이션 링) */}
        <section className="pt-3">
          <h2 className="px-page pb-2 text-[14px] font-bold text-text">최근 함께한 친구</h2>
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
                    <span className="inline-flex rounded-full bg-surface-muted p-[2px]">
                      <Avatar size="xl" src={f.avatarUrl ?? undefined} alt={name} name={name} />
                    </span>
                  </span>
                  <span className="w-full truncate text-center text-[12px] text-text-muted">
                    {name}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* 친구 목록 — 가나다순 / 모임 많은 순 토글 */}
        <section>
          <div className="flex items-center justify-between px-page pb-1">
            <h2 className="text-[14px] font-bold text-text">친구 {friends.length}</h2>
            <div className="flex items-center gap-1.5 text-[12px]">
              <button
                type="button"
                onClick={() => setSortBy("name")}
                className={sortBy === "name" ? "font-bold text-text" : "text-text-disabled active:opacity-70"}
              >
                가나다순
              </button>
              <span className="text-text-disabled/40">·</span>
              <button
                type="button"
                onClick={() => setSortBy("shared")}
                className={sortBy === "shared" ? "font-bold text-text" : "text-text-disabled active:opacity-70"}
              >
                모임 많은 순
              </button>
            </div>
          </div>
          <div className="px-page py-3">
            <SearchBar
              placeholder="친구 이름으로 검색"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onClear={() => setQuery("")}
            />
          </div>
          {filtered.length === 0 ? (
            <EmptyState icon="search" title="검색 결과가 없어요" />
          ) : (
            <ul className="divide-y divide-border bg-surface">
              {filtered.map((f, i) => {
                const name = f.name ?? "이름 없음";
                const initial = getInitial(f.name);
                const isFirstOfInitial =
                  showIndex &&
                  (i === 0 || initial !== getInitial(filtered[i - 1]?.name));
                return (
                  <li
                    key={f.id}
                    id={isFirstOfInitial ? `fr-init-${initial}` : undefined}
                    className={isFirstOfInitial ? "scroll-mt-3" : undefined}
                  >
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => handleRowClick(f)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          goDetail(f.id);
                        }
                      }}
                      onPointerDown={() => startPress(f)}
                      onPointerUp={cancelPress}
                      onPointerLeave={cancelPress}
                      onPointerCancel={cancelPress}
                      onContextMenu={(e) => e.preventDefault()}
                      className={`flex cursor-pointer items-center gap-3 py-3 pl-page active:bg-surface-muted ${
                        showIndex ? "pr-8" : "pr-page"
                      }`}
                    >
                      <Avatar size="md" src={f.avatarUrl ?? undefined} alt={name} name={name} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[15px] font-bold text-text">{name}</p>
                        <p className="truncate text-[12px] text-text-disabled">함께한 모임 {f.sharedCount}회</p>
                        <p className="mt-0.5 flex min-w-0 items-center gap-1 text-[12px] text-text-disabled">
                          <Icon name="clock" size="sm" color="inactive" decorative />
                          <span className="truncate">{f.lastSharedTitle}</span>
                        </p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
      {showIndex && (
        <FriendsIndexBar
          letters={indexLetters}
          activeSet={presentInitials}
          onJump={jumpToInitial}
        />
      )}

      {/* 길게 누르기 → 가운데 액션 팝업 */}
      <Modal
        open={!!actionTarget}
        onOpenChange={(open) => !open && setActionTarget(null)}
        size="sm"
        showClose={false}
        title={actionTarget?.name ?? "친구"}
      >
        <div className="mt-1">
          <button
            type="button"
            onClick={() => {
              setConfirmTarget(actionTarget);
              setActionTarget(null);
            }}
            className="w-full rounded-lg py-2 text-left text-[15px] font-bold text-red-500 active:bg-surface-muted"
          >
            삭제
          </button>
        </div>
      </Modal>

      {/* 삭제 확인 모달 */}
      <ConfirmDialog
        open={!!confirmTarget}
        onOpenChange={(open) => !open && setConfirmTarget(null)}
        title="친구 삭제"
        description={`${confirmTarget?.name ?? "이 친구"}님을 친구 목록에서 삭제합니다. ‘삭제한 친구’에서 되돌릴 수 있어요.`}
        confirmLabel="삭제"
        cancelLabel="취소"
        loading={hideFriend.isPending}
        onConfirm={() => {
          if (!confirmTarget) return;
          hideFriend.mutate(confirmTarget.id, {
            onSuccess: () => setConfirmTarget(null),
          });
        }}
      />
    </>
  );
};
