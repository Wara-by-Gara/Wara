// 홈 활동 피드 훅.
// 서버 활동 피드는 초대장 단위(GET /invitations/:id/activity)라 전역 피드가 없다.
// 내가 호스트인 초대장들의 활동을 전역 커서(occurredAt)로 병합해 하나의 홈 피드로 만든다.
// 각 페이지에서 모든 초대장에 동일한 before 커서로 요청 → 병합·정렬 후 상위 N개를 취하고,
// 마지막(가장 오래된) 항목의 시각을 다음 커서로 넘긴다(전역 순서 유지).
import { useInfiniteQuery } from '@tanstack/react-query';

import { activityKeys, fetchInvitationActivity, type ActivityItem } from '@/api/activityEvents';

const HOME_PAGE_SIZE = 20;

/** 활동 항목 + 출처 초대장 id (딥링크용). */
export type HomeActivityItem = ActivityItem & { invitationId: string };

export type HomeActivityPage = {
  items: HomeActivityItem[];
  nextCursor: string | null;
};

/**
 * 여러 초대장의 활동을 병합한 홈 피드(무한 스크롤).
 * 주의: 동일한 occurredAt이 페이지 경계에 정확히 걸치는 희귀 케이스는 누락될 수 있음(MVP 허용).
 */
export function useHomeActivityFeed(invitationIds: string[]) {
  return useInfiniteQuery({
    queryKey: activityKeys.home(invitationIds),
    queryFn: async ({ pageParam, signal }): Promise<HomeActivityPage> => {
      const perInvitation = await Promise.all(
        invitationIds.map((id) =>
          fetchInvitationActivity(id, { cursor: pageParam, limit: HOME_PAGE_SIZE, signal }).then(
            (page) => page.items.map((it): HomeActivityItem => ({ ...it, invitationId: id })),
          ),
        ),
      );

      const merged = perInvitation.flat();
      merged.sort((a, b) => (a.occurredAt < b.occurredAt ? 1 : a.occurredAt > b.occurredAt ? -1 : 0));

      const hasMore = merged.length > HOME_PAGE_SIZE;
      const items = merged.slice(0, HOME_PAGE_SIZE);
      const last = items[items.length - 1];
      const nextCursor = hasMore && last ? last.occurredAt : null;

      return { items, nextCursor };
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: invitationIds.length > 0,
  });
}
