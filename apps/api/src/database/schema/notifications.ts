import { pgTable, text, boolean, timestamp, check, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { ulid } from 'ulid';
import { notificationTypeEnum, notificationTargetTypeEnum, remindTypeEnum } from './enums';
import { users } from './users';
import { invitations } from './invitations';

export const notifications = pgTable('notifications', {
  id: text('id').primaryKey().$defaultFn(() => ulid()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  actorUserId: text('actor_user_id').references(() => users.id, { onDelete: 'set null' }),
  type: notificationTypeEnum('type').notNull(),
  content: text('content').notNull(),
  targetType: notificationTargetTypeEnum('target_type'),
  targetId: text('target_id'),
  isRead: boolean('is_read').notNull().default(false),
  readAt: timestamp('read_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  check('check_notification_target', sql`(${t.targetType} IS NOT NULL AND ${t.targetId} IS NOT NULL) OR (${t.targetType} IS NULL AND ${t.targetId} IS NULL)`),
]);

export const notificationSettings = pgTable('notification_settings', {
  id: text('id').primaryKey().$defaultFn(() => ulid()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),
  isRemind: boolean('is_remind').notNull().default(true),
  isFeedback: boolean('is_feedback').notNull().default(true),
  isInvitationDate: boolean('is_invitation_date').notNull().default(true),
  isPhoto: boolean('is_photo').notNull().default(true),
  isMission: boolean('is_mission').notNull().default(true),
  isParticipantLocations: boolean('is_participant_locations').notNull().default(true),
  isEventLocations: boolean('is_event_locations').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const remindLogs = pgTable('remind_logs', {
  id: text('id').primaryKey().$defaultFn(() => ulid()),
  invitationId: text('invitation_id')
    .notNull()
    .references(() => invitations.id, { onDelete: 'cascade' }),
  remindType: remindTypeEnum('remind_type').notNull(),
  sentAt: timestamp('sent_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex('uq_remind_logs_invitation_type').on(t.invitationId, t.remindType),
  index('idx_remind_logs_invitation').on(t.invitationId),
]);

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
export type NotificationSetting = typeof notificationSettings.$inferSelect;
export type RemindLog = typeof remindLogs.$inferSelect;
