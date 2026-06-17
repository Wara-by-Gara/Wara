import { pgTable, text, integer, boolean, timestamp, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { ulid } from 'ulid';
import { invitations, participants } from './invitations';

/** 호스트가 초대장에 추가하는 맞춤 질문 */
export const invitationQuestions = pgTable(
  'invitation_questions',
  {
    id: text('id').primaryKey().$defaultFn(() => ulid()),
    invitationId: text('invitation_id')
      .notNull()
      .references(() => invitations.id, { onDelete: 'cascade' }),
    question: text('question').notNull(),
    sortOrder: integer('sort_order').notNull().default(0),
    required: boolean('required').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => [index('idx_invitation_questions_invitation').on(t.invitationId)],
);

/** 게스트의 질문 응답 (참가자 × 질문 1개) */
export const questionAnswers = pgTable(
  'question_answers',
  {
    id: text('id').primaryKey().$defaultFn(() => ulid()),
    questionId: text('question_id')
      .notNull()
      .references(() => invitationQuestions.id, { onDelete: 'cascade' }),
    participantId: text('participant_id')
      .notNull()
      .references(() => participants.id, { onDelete: 'cascade' }),
    answer: text('answer').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('uq_question_answers_question_participant').on(t.questionId, t.participantId),
    index('idx_question_answers_participant').on(t.participantId),
  ],
);

export type InvitationQuestion = typeof invitationQuestions.$inferSelect;
export type NewInvitationQuestion = typeof invitationQuestions.$inferInsert;
export type QuestionAnswer = typeof questionAnswers.$inferSelect;
export type NewQuestionAnswer = typeof questionAnswers.$inferInsert;
