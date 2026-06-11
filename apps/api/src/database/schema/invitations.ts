import { pgTable, text, varchar, boolean, timestamp, integer, uniqueIndex, index, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { ulid } from 'ulid';
import { invitationStatusEnum, linkEventTypeEnum, mainCoverTypeEnum, memberRoleEnum, rsvpStatusEnum, sendChannelEnum } from './enums';
import { users } from './users';

export const invitationTemplates = pgTable('invitation_templates', {
  id: text('id').primaryKey().$defaultFn(() => ulid()),
  name: varchar('name', { length: 100 }).notNull(),
  previewImageKey: text('preview_image_key').notNull(),
  theme: varchar('theme', { length: 50 }).notNull(),
  font: varchar('font', { length: 50 }).notNull(),
  effect: varchar('effect', { length: 50 }),
  prompt: text('prompt').default(
    '왼쪽 이미지의 인물을 오른쪽 이미지의 초대장 배경 디자인에 자연스럽게 합성해 주세요. 배경 디자인과 분위기를 최대한 유지하면서 인물을 배경에 어울리게 배치해 주세요.',
  ),
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
  mainCoverType: mainCoverTypeEnum('main_cover_type').notNull().default('image'),
  mainImageKey: text('main_image_key'),
  mainImageThumbnailKey: text('main_image_thumbnail_key'),
  mainGifUrl: text('main_gif_url'),
  eventStartAt: timestamp('event_start_at', { withTimezone: true }),
  isMissionEnabled: boolean('is_mission_enabled').notNull().default(false),
  bgColor: varchar('bg_color', { length: 50 }).notNull().default('bg-white'),
  font: varchar('font', { length: 50 }).notNull().default('default'),
  rsvpAttendingEmoji: varchar('rsvp_attending_emoji', { length: 10 }).notNull().default('🎉'),
  rsvpAttendingLabel: varchar('rsvp_attending_label', { length: 20 }).notNull().default('참석'),
  rsvpMaybeEmoji: varchar('rsvp_maybe_emoji', { length: 10 }).notNull().default('🤔'),
  rsvpMaybeLabel: varchar('rsvp_maybe_label', { length: 20 }).notNull().default('미정'),
  rsvpDeclinedEmoji: varchar('rsvp_declined_emoji', { length: 10 }).notNull().default('😭'),
  rsvpDeclinedLabel: varchar('rsvp_declined_label', { length: 20 }).notNull().default('불참'),
  animation: varchar('animation', { length: 50 }),
  /** 모임 옵션 (선택) */
  fee: varchar('fee', { length: 100 }),
  dressCode: varchar('dress_code', { length: 100 }),
  parkingInfo: text('parking_info'),
  /** true: 탐색·추천 이벤트 노출 / false: 비공개(링크 초대만) */
  isPublic: boolean('is_public').notNull().default(false),
  /** 탐색 필터용 — tech, fitness, food, art, culture, health */
  category: varchar('category', { length: 20 }),
  /** 상세 조회수 (탐색 조회순 정렬용) */
  viewCount: integer('view_count').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (t) => [
  check('check_cover_type_image', sql`${t.mainCoverType} <> 'image' OR (${t.mainImageKey} IS NOT NULL AND ${t.mainGifUrl} IS NULL)`),
  check('check_cover_type_gif', sql`${t.mainCoverType} <> 'gif' OR (${t.mainGifUrl} IS NOT NULL AND ${t.mainImageKey} IS NULL)`),
  index('idx_invitations_user_id').on(t.userId),
  index('idx_invitations_public_explore').on(t.isPublic, t.category),
]);

export const participants = pgTable('participants', {
  id: text('id').primaryKey().$defaultFn(() => ulid()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  invitationId: text('invitation_id').notNull().references(() => invitations.id, { onDelete: 'cascade' }),
  memberRole: memberRoleEnum('member_role').notNull(),
  rsvpStatus: rsvpStatusEnum('rsvp_status').notNull().default('undecided'),
  isHidden: boolean('is_hidden').notNull().default(false),
  note: text('note'),
  hostMemo: text('host_memo'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex('uq_participants_user_invitation').on(t.userId, t.invitationId),
  // (user_id, invitation_id) uniqueIndex는 leftmost 규칙상 invitation_id 단독 조회에 못 씀.
  // "초대장의 참가자 목록" 쿼리 가속용 단독 인덱스.
  index('idx_participants_invitation_id').on(t.invitationId),
]);

export const invitationSendLogs = pgTable('invitation_send_logs', {
  id: text('id').primaryKey().$defaultFn(() => ulid()),
  invitationId: text('invitation_id').notNull().references(() => invitations.id, { onDelete: 'cascade' }),
  senderId: text('sender_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  channel: sendChannelEnum('channel').notNull(),
  inviteUrl: text('invite_url').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_send_logs_created_at').on(t.createdAt),
]);

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

export const invitationLinkEvents = pgTable('invitation_link_events', {
  id: text('id').primaryKey().$defaultFn(() => ulid()),
  logId: text('log_id')
    .notNull()
    .references(() => invitationSendLogs.id, { onDelete: 'cascade' }),
  eventType: linkEventTypeEnum('event_type').notNull(),
  userId: text('user_id')
    .references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
}, (t) => [
  index('idx_link_events_log_id').on(t.logId),
  index('idx_link_events_type').on(t.eventType),
  index('idx_link_events_created_at').on(t.createdAt),
]);

export type Invitation = typeof invitations.$inferSelect;
export type NewInvitation = typeof invitations.$inferInsert;
export type Participant = typeof participants.$inferSelect;
export type NewParticipant = typeof participants.$inferInsert;
export type InvitationTemplate = typeof invitationTemplates.$inferSelect;
export type InvitationBlocklist = typeof invitationBlocklists.$inferSelect;
export type NewInvitationBlocklist = typeof invitationBlocklists.$inferInsert;
export type InvitationSendLog = typeof invitationSendLogs.$inferSelect;
export type InvitationLinkEvent = typeof invitationLinkEvents.$inferSelect;
