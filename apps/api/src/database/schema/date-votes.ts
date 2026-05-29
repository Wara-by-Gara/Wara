import { pgTable, text, boolean, integer, varchar, timestamp, uniqueIndex, index, date } from 'drizzle-orm/pg-core';
import { ulid } from 'ulid';
import { dateVotePollStatusEnum, dateVoteResponseEnum } from './enums';
import { invitations, participants } from './invitations';

// ── date_vote_polls ─────────────────────────────────────────────────────────
// 초대장당 1개. confirmedSlotId는 date_vote_slots을 참조하지만
// polls ↔ slots 간 순환 FK를 피하기 위해 inline references 없이 text만 선언.
export const dateVotePolls = pgTable(
  'date_vote_polls',
  {
    id:              text('id').primaryKey().$defaultFn(() => ulid()),
    invitationId:    text('invitation_id').notNull().references(() => invitations.id, { onDelete: 'cascade' }),
    closesAt:        timestamp('closes_at', { withTimezone: true }).notNull(),
    status:          dateVotePollStatusEnum('status').notNull().default('open'),
    isAnonymous:     boolean('is_anonymous').notNull().default(false),
    confirmedSlotId: text('confirmed_slot_id'), /** 확정된 슬롯 ID. 순환 참조 회피를 위해 FK constraint 없이 관리. */
    reminderSentAt:  timestamp('reminder_sent_at', { withTimezone: true }), /** 마감 30분 전 리마인더 발송 완료 여부 추적 */
    createdAt:       timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt:       timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt:       timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => [
    uniqueIndex('uq_date_vote_polls_invitation').on(t.invitationId),
    index('idx_date_vote_polls_status').on(t.status),
    index('idx_date_vote_polls_closes_at').on(t.closesAt),
  ],
);

// ── date_vote_slots ──────────────────────────────────────────────────────────
// 날짜+시간 후보. 폴당 최대 30개.
// startTime null = 종일(시간 미지정).
export const dateVoteSlots = pgTable('date_vote_slots', {
  id:        text('id').primaryKey().$defaultFn(() => ulid()),
  pollId:    text('poll_id').notNull().references(() => dateVotePolls.id, { onDelete: 'cascade' }),
  date:      date('date').notNull(),                        // 'YYYY-MM-DD'
  startTime: varchar('start_time', { length: 5 }),          // 'HH:MM', null = 종일
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ── date_vote_responses ──────────────────────────────────────────────────────
// 참가자(호스트 포함)의 슬롯별 응답. 슬롯 × 참가자 = unique.
export const dateVoteResponses = pgTable(
  'date_vote_responses',
  {
    id:            text('id').primaryKey().$defaultFn(() => ulid()),
    slotId:        text('slot_id').notNull().references(() => dateVoteSlots.id, { onDelete: 'cascade' }),
    participantId: text('participant_id').notNull().references(() => participants.id, { onDelete: 'cascade' }),
    response:      dateVoteResponseEnum('response').notNull(), // 'good' | 'maybe' | 'bad'
    createdAt:     timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt:     timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('uq_date_vote_responses_slot_participant').on(t.slotId, t.participantId),
  ],
);

export type DateVotePoll     = typeof dateVotePolls.$inferSelect;
export type NewDateVotePoll  = typeof dateVotePolls.$inferInsert;
export type DateVoteSlot     = typeof dateVoteSlots.$inferSelect;
export type NewDateVoteSlot  = typeof dateVoteSlots.$inferInsert;
export type DateVoteResponse     = typeof dateVoteResponses.$inferSelect;
export type NewDateVoteResponse  = typeof dateVoteResponses.$inferInsert;
