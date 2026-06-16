"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createQuestion,
  deleteQuestion,
  getQuestionAnswers,
  getQuestions,
  submitAnswers,
} from "@/lib/api/questionnaire";

const questionsKey = (id: string) => ["invitations", id, "questions"] as const;
const answersKey = (id: string) => ["invitations", id, "question-answers"] as const;

export function useQuestions(invitationId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: questionsKey(invitationId),
    queryFn: () => getQuestions(invitationId),
    enabled: options?.enabled,
  });
}

export function useQuestionAnswers(invitationId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: answersKey(invitationId),
    queryFn: () => getQuestionAnswers(invitationId),
    enabled: options?.enabled,
  });
}

export function useCreateQuestion(invitationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ question, required }: { question: string; required?: boolean }) =>
      createQuestion(invitationId, question, required),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: questionsKey(invitationId) }),
  });
}

export function useDeleteQuestion(invitationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (questionId: string) => deleteQuestion(invitationId, questionId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: questionsKey(invitationId) }),
  });
}

export function useSubmitAnswers(invitationId: string) {
  return useMutation({
    mutationFn: (answers: { questionId: string; answer: string }[]) =>
      submitAnswers(invitationId, answers),
  });
}
