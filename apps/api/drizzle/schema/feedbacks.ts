import { pgTable, text, integer, timestamp, boolean } from 'drizzle-orm/pg-core';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';
import { ulid } from 'ulid';
import { invitations, participants } from './invitations';
import { photos } from './photos';

export const feedbacks = pgTable('feedbacks', {
  id: text('id').primaryKey().$defaultFn(() => ulid()),
  participantId: text('participant_id').notNull().references(() => participants.id, { onDelete: 'cascade' }),
  invitationId: text('invitation_id').references(() => invitations.id, { onDelete: 'cascade' }),
  photoId: text('photo_id').references(() => photos.id, { onDelete: 'cascade' }),
  parentId: text('parent_id').references((): AnyPgColumn => feedbacks.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  likeCount: integer('like_count').notNull().default(0),
  isDeleted: boolean('is_deleted').notNull().default(false),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const feedbackLikes = pgTable('feedback_likes', {
  id: text('id').primaryKey().$defaultFn(() => ulid()),
  feedbackId: text('feedback_id').notNull().references(() => feedbacks.id, { onDelete: 'cascade' }),
  participantId: text('participant_id').notNull().references(() => participants.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type Feedback = typeof feedbacks.$inferSelect;
export type NewFeedback = typeof feedbacks.$inferInsert;
export type FeedbackLike = typeof feedbackLikes.$inferSelect;
