import { pgTable, text, varchar, timestamp, index } from 'drizzle-orm/pg-core';
import { ulid } from 'ulid';
import { users } from './users';
import { invitations } from './invitations';

export const AI_JOB_STATUSES = ['pending', 'processing', 'completed', 'failed'] as const;
export type AiJobStatus = (typeof AI_JOB_STATUSES)[number];

export const aiImageJobs = pgTable(
  'ai_image_jobs',
  {
    id: text('id').primaryKey().$defaultFn(() => ulid()),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    invitationId: text('invitation_id')
      .notNull()
      .references(() => invitations.id, { onDelete: 'cascade' }),
    uploadedImageKey: text('uploaded_image_key').notNull(),
    status: varchar('status', { length: 20 }).notNull().default('pending'),
    resultKey: text('result_key'),
    errorCode: text('error_code'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
  },
  (t) => [
    index('idx_ai_jobs_user_created').on(t.userId, t.createdAt),
    index('idx_ai_jobs_invitation').on(t.invitationId),
    index('idx_ai_jobs_status').on(t.status),
  ],
);

export type AiImageJob = typeof aiImageJobs.$inferSelect;
export type NewAiImageJob = typeof aiImageJobs.$inferInsert;
