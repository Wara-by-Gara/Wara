'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/constants/queryKeys';
import {
  getActiveFaq,
  getAdminFaq,
  createFaqItem,
  updateFaqItem,
  deleteFaqItem,
} from '@/lib/api/faq';
import type { CreateFaqPayload, UpdateFaqPayload } from '@/lib/api/faq';

export function useActiveFaq() {
  return useQuery({
    queryKey: QUERY_KEYS.faq.active(),
    queryFn: getActiveFaq,
  });
}

export function useAdminFaq() {
  return useQuery({
    queryKey: QUERY_KEYS.faq.adminAll(),
    queryFn: getAdminFaq,
  });
}

export function useCreateFaq() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateFaqPayload) => createFaqItem(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.faq.adminAll() });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.faq.active() });
    },
  });
}

export function useUpdateFaq() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateFaqPayload }) =>
      updateFaqItem(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.faq.adminAll() });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.faq.active() });
    },
  });
}

export function useDeleteFaq() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteFaqItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.faq.adminAll() });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.faq.active() });
    },
  });
}
