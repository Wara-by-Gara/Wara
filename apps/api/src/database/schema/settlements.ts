import { pgTable, text, integer, boolean, timestamp, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { ulid } from 'ulid';
import { settlementStatusEnum, settlementSplitTypeEnum } from './enums';
import { invitations, participants } from './invitations';

// ── settlements ───────────────────────────────────────────────────────────────
// 초대장당 1개. 정산 상태 + 공유 설정.
export const settlements = pgTable(
  'settlements',
  {
    id:           text('id').primaryKey().$defaultFn(() => ulid()),
    invitationId: text('invitation_id').notNull().references(() => invitations.id, { onDelete: 'cascade' }),
    status:       settlementStatusEnum('status').notNull().default('open'),
    isAnonymized: boolean('is_anonymized').notNull().default(false), /** 공유 시 참가자 실명 대신 익명 표기 */
    shareToken:   text('share_token'), /** 읽기전용 공유 링크 토큰. null = 공유 비활성 */
    createdAt:    timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt:    timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt:    timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => [
    uniqueIndex('uq_settlements_invitation').on(t.invitationId).where(sql`${t.deletedAt} IS NULL`),
    uniqueIndex('uq_settlements_share_token').on(t.shareToken),
  ],
);

// ── settlement_expenses ───────────────────────────────────────────────────────
// 비용 항목. amount는 원(KRW) 정수.
export const settlementExpenses = pgTable(
  'settlement_expenses',
  {
    id:                 text('id').primaryKey().$defaultFn(() => ulid()),
    settlementId:       text('settlement_id').notNull().references(() => settlements.id, { onDelete: 'cascade' }),
    payerParticipantId: text('payer_participant_id').notNull().references(() => participants.id, { onDelete: 'cascade' }),
    title:              text('title').notNull(),
    amount:             integer('amount').notNull(), /** 원(KRW) 정수, >0 */
    splitType:          settlementSplitTypeEnum('split_type').notNull().default('equal'),
    createdAt:          timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt:          timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt:          timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => [
    index('idx_settlement_expenses_settlement').on(t.settlementId),
  ],
);

// ── settlement_expense_shares ─────────────────────────────────────────────────
// 항목별 참가자 분담액. equal이면 균등 분배 결과가 저장됨(잔여는 앞 참가자에 +1).
export const settlementExpenseShares = pgTable(
  'settlement_expense_shares',
  {
    id:            text('id').primaryKey().$defaultFn(() => ulid()),
    expenseId:     text('expense_id').notNull().references(() => settlementExpenses.id, { onDelete: 'cascade' }),
    participantId: text('participant_id').notNull().references(() => participants.id, { onDelete: 'cascade' }),
    share:         integer('share').notNull(), /** 원(KRW) 정수, >=0 */
  },
  (t) => [
    uniqueIndex('uq_settlement_share_expense_participant').on(t.expenseId, t.participantId),
  ],
);

export type Settlement            = typeof settlements.$inferSelect;
export type NewSettlement         = typeof settlements.$inferInsert;
export type SettlementExpense     = typeof settlementExpenses.$inferSelect;
export type NewSettlementExpense  = typeof settlementExpenses.$inferInsert;
export type SettlementExpenseShare    = typeof settlementExpenseShares.$inferSelect;
export type NewSettlementExpenseShare = typeof settlementExpenseShares.$inferInsert;
