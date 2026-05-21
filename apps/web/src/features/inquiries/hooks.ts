'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { inquiriesApi } from './api';
import type { CreateInquiryInput, UpdateInquiryInput, AnswerInquiryInput } from './types';

export const inquiryKeys = {
  all: ['inquiries'] as const,
  myList: () => [...inquiryKeys.all, 'me'] as const,
  publicList: () => [...inquiryKeys.all, 'public'] as const,
  detail: (id: string) => [...inquiryKeys.all, id] as const,
  adminList: () => [...inquiryKeys.all, 'admin'] as const,
  adminDetail: (id: string) => [...inquiryKeys.all, 'admin', id] as const,
};

// 내 문의 목록
export function useMyInquiries() {
  return useQuery({
    queryKey: inquiryKeys.myList(),
    queryFn: inquiriesApi.getMyList,
  });
}

// 공개 문의 목록
export function usePublicInquiries() {
  return useQuery({
    queryKey: inquiryKeys.publicList(),
    queryFn: inquiriesApi.getPublicList,
  });
}

// 문의 상세
export function useInquiry(id: string) {
  return useQuery({
    queryKey: inquiryKeys.detail(id),
    queryFn: () => inquiriesApi.getById(id),
  });
}

// 문의 생성
export function useCreateInquiry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateInquiryInput) => inquiriesApi.create(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inquiryKeys.myList() });
      queryClient.invalidateQueries({ queryKey: inquiryKeys.publicList() });
    },
  });
}

// 문의 수정 (pending 상태만 가능)
export function useUpdateInquiry(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateInquiryInput) => inquiriesApi.update(id, body),
    onSuccess: (updated) => {
      queryClient.setQueryData(inquiryKeys.detail(id), updated);
      queryClient.invalidateQueries({ queryKey: inquiryKeys.myList() });
    },
  });
}

// 문의 삭제
export function useDeleteInquiry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => inquiriesApi.delete(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: inquiryKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: inquiryKeys.myList() });
      queryClient.invalidateQueries({ queryKey: inquiryKeys.publicList() });
    },
  });
}

// 관리자: 전체 문의 목록
export function useAdminInquiries() {
  return useQuery({
    queryKey: inquiryKeys.adminList(),
    queryFn: inquiriesApi.admin.getAll,
  });
}

// 관리자: 문의 상세
export function useAdminInquiry(id: string) {
  return useQuery({
    queryKey: inquiryKeys.adminDetail(id),
    queryFn: () => inquiriesApi.admin.getById(id),
  });
}

// 관리자: 답변 등록
export function useAnswerInquiry(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: AnswerInquiryInput) => inquiriesApi.admin.answer(id, body),
    onSuccess: (updated) => {
      queryClient.setQueryData(inquiryKeys.adminDetail(id), updated);
      queryClient.invalidateQueries({ queryKey: inquiryKeys.adminList() });
    },
  });
}
