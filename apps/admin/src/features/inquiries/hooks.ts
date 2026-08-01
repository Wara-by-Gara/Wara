import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchInquiries, fetchInquiry, answerInquiry } from './api';

const inquiryKeys = {
  all: ['inquiries'] as const,
  list: () => [...inquiryKeys.all, 'list'] as const,
  detail: (id: string) => [...inquiryKeys.all, id] as const,
};

export function useInquiries() {
  return useQuery({
    queryKey: inquiryKeys.list(),
    queryFn: fetchInquiries,
  });
}

export function useInquiry(id: string) {
  return useQuery({
    queryKey: inquiryKeys.detail(id),
    queryFn: () => fetchInquiry(id),
    enabled: !!id,
  });
}

export function useAnswerInquiry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      answer,
      status,
    }: {
      id: string;
      answer: string;
      status: 'in_progress' | 'resolved';
    }) => answerInquiry(id, { answer, status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: inquiryKeys.all }),
  });
}
