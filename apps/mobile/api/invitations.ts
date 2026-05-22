import { apiFetch } from './client';

// 와라 API의 Invitation 응답 형태 (apps/api/src/database/schema/invitations.ts).
// JSON 직렬화로 모든 timestamp는 ISO 문자열.
export type Invitation = {
  id: string;
  userId: string;
  templateId: string | null;
  status: 'active' | 'closed';
  title: string;
  description: string;
  mainImageKey: string;
  eventStartAt: string | null;
  isMissionEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

/**
 * GET /invitations — 로그인한 본인이 host인 초대장 목록 (createdAt DESC).
 * 와라 envelope의 data 필드만 반환 (apiFetch가 처리).
 */
export function fetchMyInvitations(opts: { signal?: AbortSignal } = {}) {
  return apiFetch<Invitation[]>('/invitations', { signal: opts.signal });
}

/**
 * GET /invitations/:id — 초대장 상세 (비로그인 접근 가능, RSVP는 별도 인증).
 */
export function fetchInvitation(
  id: string,
  opts: { signal?: AbortSignal } = {},
) {
  return apiFetch<Invitation>(`/invitations/${id}`, {
    signal: opts.signal,
    authenticated: false,
  });
}

// queryKey 컨벤션: [domain, scope, ...filters]
// - 전체 invalidate: ['invitations']
// - 본인 목록만 invalidate: ['invitations', 'me']
// - 특정 상세 invalidate: ['invitations', 'detail', id]
export const invitationKeys = {
  all: ['invitations'] as const,
  myList: ['invitations', 'me'] as const,
  detail: (id: string) => ['invitations', 'detail', id] as const,
};
