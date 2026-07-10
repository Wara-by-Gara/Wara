// 맞춤 질문 TanStack Query 훅 — 호스트 질문 관리(추가/삭제/응답 열람)용.

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createQuestion,
  deleteQuestion,
  fetchQuestionAnswers,
  fetchQuestions,
  questionnaireKeys,
} from '@/api/questionnaire';

export function useQuestions(invitationId: string, opts: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: questionnaireKeys.list(invitationId),
    queryFn: ({ signal }) => fetchQuestions(invitationId, { signal }),
    enabled: (opts.enabled ?? true) && !!invitationId,
  });
}

/** 질문별 응답 모음 — HOST 전용 엔드포인트. */
export function useQuestionAnswers(invitationId: string, opts: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: questionnaireKeys.answers(invitationId),
    queryFn: ({ signal }) => fetchQuestionAnswers(invitationId, { signal }),
    enabled: (opts.enabled ?? true) && !!invitationId,
  });
}

export function useCreateQuestion(invitationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { question: string; required?: boolean }) =>
      createQuestion(invitationId, vars.question, vars.required ?? false),
    onSuccess: () => qc.invalidateQueries({ queryKey: questionnaireKeys.list(invitationId) }),
  });
}

export function useDeleteQuestion(invitationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (questionId: string) => deleteQuestion(invitationId, questionId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: questionnaireKeys.list(invitationId) });
      qc.invalidateQueries({ queryKey: questionnaireKeys.answers(invitationId) });
    },
  });
}
