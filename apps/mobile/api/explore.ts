// 공개 초대장 탐색 API — 웹 apps/web/src/lib/api/invitations.ts 의 공개 탐색 함수 포팅.
// 목록은 커서 페이지네이션(nextCursor/hasNext), 지도는 bbox 마커.

import { apiFetch } from './client';

export type PublicInvitationExplore = {
  id: string;
  title: string;
  description: string;
  category: string;
  eventStartAt: string | null;
  mainImageUrl: string | null;
  location: string | null;
  participantCount: number;
  viewCount: number;
  host: {
    name: string | null;
    nickname: string | null;
    profileImageUrl: string | null;
  } | null;
};

export type PublicInvitationsPage = {
  items: PublicInvitationExplore[];
  nextCursor: string | null;
  hasNext: boolean;
};

export type ExploreSort = 'latest' | 'deadline' | 'views';

export function getPublicInvitations(
  params: {
    category?: string;
    q?: string;
    sort?: ExploreSort;
    limit?: number;
    cursor?: string;
  } = {},
  opts: { signal?: AbortSignal } = {},
): Promise<PublicInvitationsPage> {
  const search = new URLSearchParams();
  if (params.category) search.set('category', params.category);
  if (params.q) search.set('q', params.q);
  if (params.sort) search.set('sort', params.sort);
  if (params.limit != null) search.set('limit', String(params.limit));
  if (params.cursor) search.set('cursor', params.cursor);
  const qs = search.toString();
  return apiFetch<PublicInvitationsPage>(
    qs ? `/invitations/explore?${qs}` : '/invitations/explore',
    { signal: opts.signal },
  );
}

export type PublicInvitationMapMarker = {
  id: string;
  title: string;
  category: string | null;
  eventStartAt: string | null;
  lat: number;
  lng: number;
  mainImageThumbnailUrl: string | null;
};

export function getPublicMapInvitations(
  params: {
    neLat: number;
    neLng: number;
    swLat: number;
    swLng: number;
    category?: string;
    limit?: number;
  },
  opts: { signal?: AbortSignal } = {},
): Promise<PublicInvitationMapMarker[]> {
  const search = new URLSearchParams({
    neLat: String(params.neLat),
    neLng: String(params.neLng),
    swLat: String(params.swLat),
    swLng: String(params.swLng),
  });
  if (params.category) search.set('category', params.category);
  if (params.limit != null) search.set('limit', String(params.limit));
  return apiFetch<PublicInvitationMapMarker[]>(
    `/invitations/explore/map?${search.toString()}`,
    { signal: opts.signal },
  );
}

// ── Query keys ───────────────────────────────────────────────────────────────
export const exploreKeys = {
  all: ['explore'] as const,
  list: (category: string | undefined, q: string | undefined, sort: ExploreSort) =>
    ['explore', 'list', category ?? 'all', q ?? '', sort] as const,
  map: (bbox: { neLat: number; neLng: number; swLat: number; swLng: number }, category?: string) =>
    ['explore', 'map', bbox, category ?? 'all'] as const,
};
