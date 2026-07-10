// 맞춤 질문(questionnaire) API — 웹 apps/web/src/lib/api/questionnaire.ts의
// 게스트용 계약(조회/응답)만 미러. 호스트용 질문 생성/삭제·답변 열람은 범위 밖.
import { apiFetch, newIdempotencyKey } from './client';

export interface InvitationQuestion {
  id: string;
  question: string;
  required: boolean;
  sortOrder: number;
}

export interface QuestionAnswerInput {
  questionId: string;
  answer: string;
}

/** GET /invitations/:id/questions — 초대장의 맞춤 질문 목록. */
export function getQuestions(invitationId: string, opts: { signal?: AbortSignal } = {}) {
  return apiFetch<InvitationQuestion[]>(`/invitations/${invitationId}/questions`, {
    signal: opts.signal,
  });
}

/** POST /invitations/:id/questions/answers — 내 답변 일괄 제출. */
export function submitAnswers(invitationId: string, answers: QuestionAnswerInput[]) {
  return apiFetch<{ ok: boolean }>(`/invitations/${invitationId}/questions/answers`, {
    method: 'POST',
    body: { answers },
    idempotencyKey: newIdempotencyKey(),
  });
}

// ── Query keys ───────────────────────────────────────────────────────────────
export const questionKeys = {
  all: ['questions'] as const,
  list: (invitationId: string) => ['questions', 'list', invitationId] as const,
};
