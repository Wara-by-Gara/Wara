import { pgTable, text, boolean, timestamp, check, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
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
}, (t) => [
  check('check_notification_target', sql`(${t.targetType} IS NOT NULL AND ${t.targetId} IS NOT NULL) OR (${t.targetType} IS NULL AND ${t.targetId} IS NULL)`),
  // 알림 목록 조회: user_id 기준 커서 페이지네이션 (id DESC)
  index('idx_notifications_user_id').on(t.userId),
  // 미읽음 카운트 조회 (countUnreadByUser): user_id + is_read = false
  index('idx_notifications_user_unread').on(t.userId, t.isRead),
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

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
export type NotificationSetting = typeof notificationSettings.$inferSelect;
