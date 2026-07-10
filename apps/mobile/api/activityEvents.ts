// 초대장 활동 피드 API 클라이언트 (커서 백필 기반).
// 서버: GET /invitations/:invitationId/activity (apps/api/src/activity-feed).
// 참가·사진·댓글·투표확정을 occurredAt 시간순(내림차순)으로 병합해 내려준다.
// 전역 홈 피드용 엔드포인트는 없고 초대장 단위이므로, 병합은 hooks에서 처리한다.
import { apiFetch } from './client';

export const ACTIVITY_TYPES = [
  'participant_joined',
  'photo_uploaded',
  'comment_added',
  'vote_confirmed',
] as const;

export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export type ActivityActor = {
  userId: string;
  name: string | null;
  nickname: string | null;
  profileImageUrl: string | null;
};

export type ActivityItem = {
  id: string; // `${type}:${sourceId}` — 소스 간 유일
  type: ActivityType;
  actor: ActivityActor | null; // vote_confirmed는 actor 없음
  occurredAt: string; // ISO 8601
  data: Record<string, unknown>;
};

export type ActivityFeedPage = {
  items: ActivityItem[];
  // 다음 페이지 커서(마지막 항목 occurredAt) 또는 더 없으면 null
  nextCursor: string | null;
};

/**
 * GET /invitations/:id/activity — 커서 이전(occurredAt <)의 항목을 최신순으로.
 * cursor 미지정 시 첫 페이지, limit 기본 20(서버 최대 50), types로 이벤트 타입 필터.
 */
export function fetchInvitationActivity(
  invitationId: string,
  opts: { cursor?: string; limit?: number; types?: ActivityType[]; signal?: AbortSignal } = {},
) {
  const params = new URLSearchParams({ limit: String(opts.limit ?? 20) });
  if (opts.cursor) params.set('cursor', opts.cursor);
  if (opts.types && opts.types.length > 0) params.set('types', opts.types.join(','));
  return apiFetch<ActivityFeedPage>(
    `/invitations/${invitationId}/activity?${params.toString()}`,
    { signal: opts.signal },
  );
}

// ── Query keys ───────────────────────────────────────────────────────────────
// [domain, scope, ...filters]
export const activityKeys = {
  all: ['activity'] as const,
  feed: (invitationId: string) => ['activity', 'feed', invitationId] as const,
  home: (invitationIds: string[]) =>
    ['activity', 'home', [...invitationIds].sort().join(',')] as const,
};
