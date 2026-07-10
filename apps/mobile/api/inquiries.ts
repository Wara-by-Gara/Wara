// 고객센터 문의 API — 웹(apps/web/src/lib/api/inquiries.ts)에서 포팅.
// 이 Phase 범위(사용자): 내 문의 목록/상세/작성/수정 (+삭제). 어드민/공개 문의는 제외.
// 응답 envelope는 apiFetch가 풀어서 data만 반환, 실패는 WaraApiError로 throw.

import { apiFetch, newIdempotencyKey } from '@/api';

export type InquiryType =
  | 'invitation'
  | 'photo'
  | 'notification'
  | 'mission'
  | 'bug'
  | 'feature'
  | 'general';

export type InquiryStatus = 'pending' | 'in_progress' | 'resolved';

export type Inquiry = {
  id: string;
  userId: string;
  inquiryType: InquiryType;
  status: InquiryStatus;
  title: string;
  content: string;
  isPublic: boolean;
  answer: string | null;
  answeredAt: string | null;
  adminId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type InquiryListResponse = {
  items: Inquiry[];
  total: number;
};

export type CreateInquiryInput = {
  inquiryType: InquiryType;
  title: string;
  content: string;
  isPublic?: boolean;
};

export type UpdateInquiryInput = {
  title: string;
  content: string;
  isPublic?: boolean;
};

// ── 조회 ────────────────────────────────────────────────────────────────────

export function fetchMyInquiries(opts: { signal?: AbortSignal } = {}) {
  return apiFetch<InquiryListResponse>('/inquiries/me', { signal: opts.signal });
}

export function fetchInquiry(id: string, opts: { signal?: AbortSignal } = {}) {
  return apiFetch<Inquiry>(`/inquiries/${id}`, { signal: opts.signal });
}

// ── 변경 ────────────────────────────────────────────────────────────────────

export function createInquiry(body: CreateInquiryInput) {
  return apiFetch<Inquiry>('/inquiries', {
    method: 'POST',
    body,
    idempotencyKey: newIdempotencyKey(),
  });
}

export function updateInquiry(id: string, body: UpdateInquiryInput) {
  return apiFetch<Inquiry>(`/inquiries/${id}`, { method: 'PATCH', body });
}

export function deleteInquiry(id: string) {
  return apiFetch<void>(`/inquiries/${id}`, { method: 'DELETE' });
}

// ── Query keys ───────────────────────────────────────────────────────────────
export const inquiryKeys = {
  all: ['inquiries'] as const,
  list: () => ['inquiries', 'list'] as const,
  detail: (id: string) => ['inquiries', 'detail', id] as const,
};
