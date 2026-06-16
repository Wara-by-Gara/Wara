import { apiDelete, apiGet, apiPost } from "./client";

export interface InvitationQuestion {
  id: string;
  question: string;
  required: boolean;
  sortOrder: number;
}

export interface QuestionWithAnswers extends InvitationQuestion {
  answers: { participantId: string; answer: string; createdAt: string }[];
}

export function getQuestions(invitationId: string): Promise<InvitationQuestion[]> {
  return apiGet<InvitationQuestion[]>(`/invitations/${invitationId}/questions`);
}

export function createQuestion(
  invitationId: string,
  question: string,
  required = false,
): Promise<InvitationQuestion> {
  return apiPost<InvitationQuestion>(`/invitations/${invitationId}/questions`, {
    question,
    required,
  });
}

export function deleteQuestion(invitationId: string, questionId: string): Promise<void> {
  return apiDelete(`/invitations/${invitationId}/questions/${questionId}`);
}

export function submitAnswers(
  invitationId: string,
  answers: { questionId: string; answer: string }[],
): Promise<{ ok: boolean }> {
  return apiPost<{ ok: boolean }>(`/invitations/${invitationId}/questions/answers`, {
    answers,
  });
}

export function getQuestionAnswers(
  invitationId: string,
): Promise<{ questions: QuestionWithAnswers[] }> {
  return apiGet<{ questions: QuestionWithAnswers[] }>(
    `/invitations/${invitationId}/questions/answers`,
  );
}
