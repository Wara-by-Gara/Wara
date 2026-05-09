import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { ulid } from 'ulid';
import { invitations, participants } from './invitations';

export const missions = pgTable('missions', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => ulid()),
  invitationId: text('invitation_id')
    .notNull()
    .references(() => invitations.id, { onDelete: 'cascade' }),
  participantId: text('participant_id')
    .notNull()
    .references(() => participants.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Mission = typeof missions.$inferSelect;
