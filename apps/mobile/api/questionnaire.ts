// 맞춤 질문(Questionnaire) API — 웹(apps/web/src/lib/api/questionnaire.ts) 계약 미러.
// 질문 목록은 누구나 열람, 질문 추가/삭제·응답 모음 조회는 HOST 전용.

import { apiFetch, newIdempotencyKey } from './client';

export type InvitationQuestion = {
  id: string;
  question: string;
  required: boolean;
  sortOrder: number;
};

export type QuestionAnswer = {
  participantId: string;
  answer: string;
  createdAt: string;
};

export type QuestionWithAnswers = InvitationQuestion & { answers: QuestionAnswer[] };

/** GET /invitations/:invitationId/questions — 질문 목록. */
export function fetchQuestions(invitationId: string, opts: { signal?: AbortSignal } = {}) {
  return apiFetch<InvitationQuestion[]>(`/invitations/${invitationId}/questions`, {
    signal: opts.signal,
  });
}

/** GET /invitations/:invitationId/questions/answers — 질문별 응답 모음 (HOST 전용). */
export function fetchQuestionAnswers(invitationId: string, opts: { signal?: AbortSignal } = {}) {
  return apiFetch<{ questions: QuestionWithAnswers[] }>(
    `/invitations/${invitationId}/questions/answers`,
    { signal: opts.signal },
  );
}

/** POST /invitations/:invitationId/questions — 질문 추가 (HOST 전용). */
export function createQuestion(invitationId: string, question: string, required = false) {
  return apiFetch<InvitationQuestion>(`/invitations/${invitationId}/questions`, {
    method: 'POST',
    body: { question, required },
    idempotencyKey: newIdempotencyKey(),
  });
}

/** DELETE /invitations/:invitationId/questions/:questionId — 질문 삭제 (HOST 전용, 204). */
export function deleteQuestion(invitationId: string, questionId: string) {
  return apiFetch<void>(`/invitations/${invitationId}/questions/${questionId}`, {
    method: 'DELETE',
  });
}

// ── Query keys ───────────────────────────────────────────────────────────────
export const questionnaireKeys = {
  list: (invitationId: string) => ['invitations', 'questions', invitationId] as const,
  answers: (invitationId: string) => ['invitations', 'question-answers', invitationId] as const,
};
