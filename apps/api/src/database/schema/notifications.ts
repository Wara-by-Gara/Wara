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
  // 알림이 속한 초대장 — 클라이언트 라우팅(예: 사진/미션 알림 → 초대장 상세) 구성용.
  // 알림 종류에 따라 null 가능 (시스템 공지 등).
  invitationId: text('invitation_id').references(() => invitations.id, { onDelete: 'cascade' }),
  isRead: boolean('is_read').notNull().default(false),
  readAt: timestamp('read_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  // soft delete — 전체/개별 삭제 시 row 보존, 조회에서 제외 (hard delete 금지 규약).
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (t) => [
  check('check_notification_target', sql`(${t.targetType} IS NOT NULL AND ${t.targetId} IS NOT NULL) OR (${t.targetType} IS NULL AND ${t.targetId} IS NULL)`),
  index('idx_notifications_invitation').on(t.invitationId),
  index('idx_notifications_user_id').on(t.userId),
]);

export const notificationSettings = pgTable('notification_settings', {
  id: text('id').primaryKey().$defaultFn(() => ulid()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),
  isRemind: boolean('is_remind').notNull().default(true),
  isFeedback: boolean('is_feedback').notNull().default(true),
  isInvitationDate: boolean('is_invitation_date').notNull().default(true),
  isPhoto: boolean('is_photo').notNull().default(true),
  isMission: boolean('is_mission').notNull().default(true),
  isMessage: boolean('is_message').notNull().default(true),
  isParticipant: boolean('is_participant').notNull().default(true),
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
