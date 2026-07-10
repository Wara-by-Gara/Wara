import { pgTable, text, timestamp, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { ulid } from 'ulid';
import { reportTargetTypeEnum, reportStatusEnum } from './enums';
import { users } from './users';
import { invitations } from './invitations';

// ── content_reports ─────────────────────────────────────────────────────────
// 사진/댓글 신고. targetId는 photos.id 또는 feedbacks.id (targetType으로 구분).
export const contentReports = pgTable(
  'content_reports',
  {
    id:             text('id').primaryKey().$defaultFn(() => ulid()),
    reporterUserId: text('reporter_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    targetType:     reportTargetTypeEnum('target_type').notNull(),
    targetId:       text('target_id').notNull(),
    invitationId:   text('invitation_id').references(() => invitations.id, { onDelete: 'set null' }), /** 신고 시점 컨텍스트 */
    reason:         text('reason'),
    status:         reportStatusEnum('status').notNull().default('pending'),
    adminMemo:      text('admin_memo'),
    handledByUserId: text('handled_by_user_id').references(() => users.id, { onDelete: 'set null' }),
    createdAt:      timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt:      timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt:      timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => [
    // 동일 사용자가 같은 대상을 중복 신고하지 못하도록 (활성 신고 기준)
    uniqueIndex('uq_content_reports_reporter_target')
      .on(t.reporterUserId, t.targetType, t.targetId)
      .where(sql`${t.deletedAt} IS NULL`),
    index('idx_content_reports_status').on(t.status),
    index('idx_content_reports_target').on(t.targetType, t.targetId),
  ],
);

export type ContentReport    = typeof contentReports.$inferSelect;
export type NewContentReport = typeof contentReports.$inferInsert;
