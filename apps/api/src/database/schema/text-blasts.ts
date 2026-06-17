import { pgTable, text, timestamp, index } from 'drizzle-orm/pg-core';
import { ulid } from 'ulid';
import { users } from './users';
import { invitations } from './invitations';

/**
 * Text Blast — 호스트가 초대장 참석자 전원에게 보내는 단체 공지.
 * 각 발송은 1개 row로 기록되고, 발송 시점에 참석자별 notification으로 팬아웃된다.
 * soft delete: deletedAt (hard delete 금지).
 */
export const textBlasts = pgTable(
  'text_blasts',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => ulid()),
    invitationId: text('invitation_id')
      .notNull()
      .references(() => invitations.id, { onDelete: 'cascade' }),
    // 발송한 호스트 (권한 이전 후에도 기록 보존 위해 set null)
    senderUserId: text('sender_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    message: text('message').notNull(),
    // 발송 시점 수신자 수 (스냅샷)
    recipientCount: text('recipient_count').notNull().default('0'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => [index('idx_text_blasts_invitation').on(t.invitationId)],
);

export type TextBlast = typeof textBlasts.$inferSelect;
export type NewTextBlast = typeof textBlasts.$inferInsert;
