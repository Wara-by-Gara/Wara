'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/constants/queryKeys';
import {
  getMyInquiries,
  getPublicInquiries,
  getInquiry,
  createInquiry,
  updateInquiry,
  deleteInquiry,
  getAdminInquiries,
  getAdminInquiry,
  answerInquiry,
} from '@/lib/api/inquiries';
import type { CreateInquiryInput, UpdateInquiryInput, AnswerInquiryInput } from '@/lib/api/inquiries';

export function useMyInquiries() {
  return useQuery({
    queryKey: QUERY_KEYS.inquiries.myList(),
    queryFn: getMyInquiries,
  });
}

export function usePublicInquiries() {
  return useQuery({
    queryKey: QUERY_KEYS.inquiries.publicList(),
    queryFn: getPublicInquiries,
  });
}

export function useInquiry(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.inquiries.detail(id),
    queryFn: () => getInquiry(id),
  });
}

export function useCreateInquiry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateInquiryInput) => createInquiry(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.inquiries.myList() });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.inquiries.publicList() });
    },
  });
}

export function useUpdateInquiry(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateInquiryInput) => updateInquiry(id, body),
    onSuccess: (updated) => {
      queryClient.setQueryData(QUERY_KEYS.inquiries.detail(id), updated);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.inquiries.myList() });
    },
  });
}

export function useDeleteInquiry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteInquiry(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: QUERY_KEYS.inquiries.detail(id) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.inquiries.myList() });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.inquiries.publicList() });
    },
  });
}

export function useAdminInquiries() {
  return useQuery({
    queryKey: QUERY_KEYS.inquiries.adminList(),
    queryFn: getAdminInquiries,
  });
}

export function useAdminInquiry(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.inquiries.adminDetail(id),
    queryFn: () => getAdminInquiry(id),
  });
}

export function useAnswerInquiry(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: AnswerInquiryInput) => answerInquiry(id, body),
    onSuccess: (updated) => {
      queryClient.setQueryData(QUERY_KEYS.inquiries.adminDetail(id), updated);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.inquiries.adminList() });
    },
  });
}
