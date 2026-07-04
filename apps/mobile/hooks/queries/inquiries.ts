// 고객센터 문의 TanStack Query 훅 — 내 문의 목록/상세 조회 + 작성/수정/삭제.
// 뮤테이션 성공 시 목록/상세 캐시를 invalidate 한다.

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createInquiry,
  deleteInquiry,
  fetchInquiry,
  fetchMyInquiries,
  inquiryKeys,
  updateInquiry,
  type CreateInquiryInput,
  type UpdateInquiryInput,
} from '@/api/inquiries';

// ── 조회 ────────────────────────────────────────────────────────────────────

export function useMyInquiries() {
  return useQuery({
    queryKey: inquiryKeys.list(),
    queryFn: ({ signal }) => fetchMyInquiries({ signal }),
  });
}

export function useInquiry(id: string) {
  return useQuery({
    queryKey: inquiryKeys.detail(id),
    queryFn: ({ signal }) => fetchInquiry(id, { signal }),
    enabled: !!id,
  });
}

// ── 변경 ────────────────────────────────────────────────────────────────────

export function useCreateInquiry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateInquiryInput) => createInquiry(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: inquiryKeys.list() }),
  });
}

export function useUpdateInquiry(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateInquiryInput) => updateInquiry(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: inquiryKeys.list() });
      qc.invalidateQueries({ queryKey: inquiryKeys.detail(id) });
    },
  });
}

export function useDeleteInquiry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteInquiry(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: inquiryKeys.list() }),
  });
}
