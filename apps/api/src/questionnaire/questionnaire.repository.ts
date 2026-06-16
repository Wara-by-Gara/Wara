import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq, isNull, inArray } from 'drizzle-orm';
import {
  invitationQuestions,
  questionAnswers,
  type NewInvitationQuestion,
} from '../database/schema';
import { DRIZZLE, DrizzleDB } from '../database/database.module';

@Injectable()
export class QuestionnaireRepository {
  constructor(@Inject(DRIZZLE) private db: DrizzleDB) {}

  async listQuestions(invitationId: string) {
    return this.db
      .select()
      .from(invitationQuestions)
      .where(
        and(
          eq(invitationQuestions.invitationId, invitationId),
          isNull(invitationQuestions.deletedAt),
        ),
      )
      .orderBy(asc(invitationQuestions.sortOrder));
  }

  async findQuestion(id: string) {
    return this.db.query.invitationQuestions.findFirst({
      where: (t, { eq, and, isNull }) =>
        and(eq(t.id, id), isNull(t.deletedAt)),
    });
  }

  async createQuestion(data: NewInvitationQuestion) {
    const [row] = await this.db.insert(invitationQuestions).values(data).returning();
    return row!;
  }

  async softDeleteQuestion(id: string, invitationId: string) {
    const [row] = await this.db
      .update(invitationQuestions)
      .set({ deletedAt: new Date() })
      .where(
        and(
          eq(invitationQuestions.id, id),
          eq(invitationQuestions.invitationId, invitationId),
          isNull(invitationQuestions.deletedAt),
        ),
      )
      .returning();
    return row ?? null;
  }

  /** 참가자 응답 upsert (질문×참가자 유니크) */
  async upsertAnswer(questionId: string, participantId: string, answer: string) {
    await this.db
      .insert(questionAnswers)
      .values({ questionId, participantId, answer })
      .onConflictDoUpdate({
        target: [questionAnswers.questionId, questionAnswers.participantId],
        set: { answer, updatedAt: new Date() },
      });
  }

  /** 초대장의 모든 응답 (호스트 열람) — 질문 id 목록으로 조회 */
  async listAnswersByQuestionIds(questionIds: string[]) {
    if (questionIds.length === 0) return [];
    return this.db
      .select()
      .from(questionAnswers)
      .where(inArray(questionAnswers.questionId, questionIds));
  }
}
