// 목적: in-app 알림 TanStack Query 훅 — 무한 목록 + 미읽음 수 + 읽음/전체읽음(낙관적).
// 소켓 실시간 갱신(useNotificationSocket)은 이 캐시 키를 직접 갱신한다.
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';

import {
  fetchNotifications,
  fetchUnreadCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  notificationKeys,
  type NotificationsPage,
} from '@/api/notifications';

const PAGE_LIMIT = 20;

export function useNotifications() {
  return useInfiniteQuery({
    queryKey: notificationKeys.list,
    queryFn: ({ pageParam, signal }) =>
      fetchNotifications(pageParam, PAGE_LIMIT, { signal }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => (last.hasNext ? (last.nextCursor ?? undefined) : undefined),
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: notificationKeys.unread,
    queryFn: ({ signal }) => fetchUnreadCount({ signal }),
    select: (d) => d.count,
  });
}

// ── 캐시 갱신 헬퍼 ──────────────────────────────────────────────────────────────

type ListCache = InfiniteData<NotificationsPage, string | undefined>;

function patchListItem(cache: ListCache | undefined, id: string): ListCache | undefined {
  if (!cache) return cache;
  const readAt = new Date().toISOString();
  return {
    ...cache,
    pages: cache.pages.map((page) => ({
      ...page,
      items: page.items.map((it) =>
        it.id === id ? { ...it, isRead: true, readAt } : it,
      ),
    })),
  };
}

function markAllRead(cache: ListCache | undefined): ListCache | undefined {
  if (!cache) return cache;
  const readAt = new Date().toISOString();
  return {
    ...cache,
    pages: cache.pages.map((page) => ({
      ...page,
      items: page.items.map((it) => (it.isRead ? it : { ...it, isRead: true, readAt })),
    })),
  };
}

/** 개별 읽음 — 목록/미읽음 수 낙관적 업데이트 후 실패 시 롤백. */
export function useMarkAsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => markNotificationAsRead(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: notificationKeys.list });
      await qc.cancelQueries({ queryKey: notificationKeys.unread });
      const prevList = qc.getQueryData<ListCache>(notificationKeys.list);
      const prevUnread = qc.getQueryData<{ count: number }>(notificationKeys.unread);
      const wasUnread = prevList?.pages.some((p) =>
        p.items.some((it) => it.id === id && !it.isRead),
      );
      qc.setQueryData<ListCache>(notificationKeys.list, (c) => patchListItem(c, id));
      if (wasUnread) {
        qc.setQueryData<{ count: number }>(notificationKeys.unread, (c) =>
          c ? { count: Math.max(0, c.count - 1) } : c,
        );
      }
      return { prevList, prevUnread };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prevList !== undefined) qc.setQueryData(notificationKeys.list, ctx.prevList);
      if (ctx?.prevUnread !== undefined) qc.setQueryData(notificationKeys.unread, ctx.prevUnread);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: notificationKeys.unread });
    },
  });
}

/** 전체 읽음 — 모든 항목 isRead + 미읽음 0. 서버는 204(void). */
export function useMarkAllAsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => markAllNotificationsAsRead(),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: notificationKeys.list });
      await qc.cancelQueries({ queryKey: notificationKeys.unread });
      const prevList = qc.getQueryData<ListCache>(notificationKeys.list);
      const prevUnread = qc.getQueryData<{ count: number }>(notificationKeys.unread);
      qc.setQueryData<ListCache>(notificationKeys.list, markAllRead);
      qc.setQueryData<{ count: number }>(notificationKeys.unread, { count: 0 });
      return { prevList, prevUnread };
    },
    onError: (_err, _v, ctx) => {
      if (ctx?.prevList !== undefined) qc.setQueryData(notificationKeys.list, ctx.prevList);
      if (ctx?.prevUnread !== undefined) qc.setQueryData(notificationKeys.unread, ctx.prevUnread);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: notificationKeys.unread });
    },
  });
}
