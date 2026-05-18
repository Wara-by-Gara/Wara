import { pgTable, text, varchar, boolean, timestamp, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { ulid } from 'ulid';
import { invitationStatusEnum, memberRoleEnum, rsvpStatusEnum, sendChannelEnum, sendStatusEnum } from './enums';
import { users } from './users';

export const invitationTemplates = pgTable('invitation_templates', {
  id: text('id').primaryKey().$defaultFn(() => ulid()),
  name: varchar('name', { length: 100 }).notNull(),
  previewImageKey: text('preview_image_key').notNull(),
  theme: varchar('theme', { length: 50 }).notNull(),
  font: varchar('font', { length: 50 }).notNull(),
  effect: varchar('effect', { length: 50 }),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const invitations = pgTable('invitations', {
  id: text('id').primaryKey().$defaultFn(() => ulid()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
  templateId: text('template_id').references(() => invitationTemplates.id, { onDelete: 'set null' }),
  status: invitationStatusEnum('status').notNull().default('active'),
  title: varchar('title', { length: 100 }).notNull(),
  description: text('description').notNull(),
  mainImageKey: text('main_image_key').notNull(),
  eventStartAt: timestamp('event_start_at', { withTimezone: true }),
  isMissionEnabled: boolean('is_mission_enabled').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});

export const participants = pgTable('participants', {
  id: text('id').primaryKey().$defaultFn(() => ulid()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  invitationId: text('invitation_id').notNull().references(() => invitations.id, { onDelete: 'cascade' }),
  memberRole: memberRoleEnum('member_role').notNull(),
  rsvpStatus: rsvpStatusEnum('rsvp_status').notNull().default('undecided'),
  isHidden: boolean('is_hidden').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex('uq_participants_user_invitation').on(t.userId, t.invitationId),
]);

export const invitationSendLogs = pgTable('invitation_send_logs', {
  id: text('id').primaryKey().$defaultFn(() => ulid()),
  invitationId: text('invitation_id').notNull().references(() => invitations.id, { onDelete: 'cascade' }),
  senderId: text('sender_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  channel: sendChannelEnum('channel').notNull(),
  inviteUrl: text('invite_url'),
  status: sendStatusEnum('status').notNull().default('sent'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const invitationBlocklists = pgTable('invitation_blocklists', {
  id: text('id').primaryKey().$defaultFn(() => ulid()),
  invitationId: text('invitation_id').notNull().references(() => invitations.id, { onDelete: 'cascade' }),
  blockedUserId: text('blocked_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  blockedByUserId: text('blocked_by_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (t) => [
  uniqueIndex('uq_blocklist_active')
    .on(t.invitationId, t.blockedUserId)
    .where(sql`${t.deletedAt} IS NULL`),
  index('idx_blocklist_invitation').on(t.invitationId),
]);

export type Invitation = typeof invitations.$inferSelect;
export type NewInvitation = typeof invitations.$inferInsert;
export type Participant = typeof participants.$inferSelect;
export type NewParticipant = typeof participants.$inferInsert;
export type InvitationTemplate = typeof invitationTemplates.$inferSelect;
export type InvitationBlocklist = typeof invitationBlocklists.$inferSelect;
export type NewInvitationBlocklist = typeof invitationBlocklists.$inferInsert;
