import { pgTable, text, boolean, timestamp } from 'drizzle-orm/pg-core';
import { ulid } from 'ulid';
import { notificationTypeEnum, notificationTargetTypeEnum } from './enums';
import { users } from './users';

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
});

export const notificationSettings = pgTable('notification_settings', {
  id: text('id').primaryKey().$defaultFn(() => ulid()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
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

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
export type NotificationSetting = typeof notificationSettings.$inferSelect;
