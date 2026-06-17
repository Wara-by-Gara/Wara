"use client";

import { useRouter } from "next/navigation";
import { Avatar, TopAppBar, EmptyState } from "@wara/ui";
import { mobileMainScroll, stickyMainTop } from "@/lib/mobilePageLayout";
import { useHiddenFriends, useRestoreFriend } from "@/hooks/useFriends";

export const HiddenFriends = () => {
  const router = useRouter();
  const { data, isLoading } = useHiddenFriends();
  const restore = useRestoreFriend();
  const friends = data?.friends ?? [];

  return (
    <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col bg-surface-muted lg:max-w-none">
      <TopAppBar
        className="absolute inset-x-0 top-0 z-30"
        title="삭제한 친구"
        onBack={() => router.back()}
      />
      <main className={`relative z-10 ${mobileMainScroll} lg:mx-auto lg:w-full lg:max-w-5xl ${stickyMainTop}`}>
        {isLoading ? (
          <p className="py-10 text-center text-[14px] text-text-disabled">불러오는 중…</p>
        ) : friends.length === 0 ? (
          <div className="flex min-h-[60vh] flex-col items-center justify-center px-page">
            <EmptyState
              icon="users"
              title="삭제한 친구가 없어요"
              description="친구를 삭제하면 여기서 되돌릴 수 있어요"
            />
          </div>
        ) : (
          <ul className="divide-y divide-border bg-surface">
            {friends.map((f) => {
              const name = f.name ?? "이름 없음";
              return (
                <li key={f.id} className="flex items-center gap-3 px-page py-3">
                  <Avatar size="md" src={f.avatarUrl ?? undefined} alt={name} name={name} />
                  <p className="min-w-0 flex-1 truncate text-[15px] font-bold text-text">
                    {name}
                  </p>
                  <button
                    type="button"
                    onClick={() => restore.mutate(f.id)}
                    disabled={restore.isPending}
                    className="shrink-0 rounded-lg border border-border px-3 py-1.5 text-[13px] font-bold text-text active:bg-surface-muted disabled:opacity-50"
                  >
                    되돌리기
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
};
