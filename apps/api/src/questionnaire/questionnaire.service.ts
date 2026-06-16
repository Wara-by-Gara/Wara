import { Injectable, NotFoundException } from '@nestjs/common';
import { ErrorCode } from '../common/constants/error-codes';
import { QuestionnaireRepository } from './questionnaire.repository';
import { CreateQuestionDto } from './dto/create-question.dto';
import { SubmitAnswersDto } from './dto/submit-answers.dto';

@Injectable()
export class QuestionnaireService {
  constructor(private readonly repository: QuestionnaireRepository) {}

  async listQuestions(invitationId: string) {
    const rows = await this.repository.listQuestions(invitationId);
    return rows.map((q) => ({
      id: q.id,
      question: q.question,
      required: q.required,
      sortOrder: q.sortOrder,
    }));
  }

  async createQuestion(invitationId: string, dto: CreateQuestionDto) {
    const existing = await this.repository.listQuestions(invitationId);
    const row = await this.repository.createQuestion({
      invitationId,
      question: dto.question,
      required: dto.required ?? false,
      sortOrder: existing.length,
    });
    return {
      id: row.id,
      question: row.question,
      required: row.required,
      sortOrder: row.sortOrder,
    };
  }

  async deleteQuestion(invitationId: string, questionId: string) {
    const deleted = await this.repository.softDeleteQuestion(questionId, invitationId);
    if (!deleted) throw new NotFoundException(ErrorCode.QUESTION_NOT_FOUND);
  }

  /** 게스트 응답 제출 — 해당 초대장 질문에만 저장 */
  async submitAnswers(
    invitationId: string,
    participantId: string,
    dto: SubmitAnswersDto,
  ) {
    const questions = await this.repository.listQuestions(invitationId);
    const validIds = new Set(questions.map((q) => q.id));
    for (const a of dto.answers) {
      if (!validIds.has(a.questionId)) continue;
      const answer = a.answer.trim();
      if (!answer) continue;
      await this.repository.upsertAnswer(a.questionId, participantId, answer);
    }
    return { ok: true };
  }

  /** 호스트 — 질문별 응답 모음 */
  async listAnswers(invitationId: string) {
    const questions = await this.repository.listQuestions(invitationId);
    const answers = await this.repository.listAnswersByQuestionIds(
      questions.map((q) => q.id),
    );
    return {
      questions: questions.map((q) => ({
        id: q.id,
        question: q.question,
        required: q.required,
        sortOrder: q.sortOrder,
        answers: answers
          .filter((a) => a.questionId === q.id)
          .map((a) => ({
            participantId: a.participantId,
            answer: a.answer,
            createdAt: a.createdAt.toISOString(),
          })),
      })),
    };
  }
}
