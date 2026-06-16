import { pgTable, text, timestamp, index } from 'drizzle-orm/pg-core';
import { ulid } from 'ulid';
import { users } from './users';

// Web Push 구독 정보. 한 유저가 여러 기기/브라우저에서 구독 가능 (PC + 폰 동시).
// endpoint가 구독 식별자 — push 서비스가 만료/해지하면 404/410 응답 → soft delete로 정리.
export const pushSubscriptions = pgTable(
  'push_subscriptions',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => ulid()),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    // 푸시 서비스 엔드포인트 URL (기기/브라우저 고유). 재구독 시 upsert 키.
    endpoint: text('endpoint').notNull().unique(),
    // 메시지 암호화용 클라이언트 공개키 / auth secret (PushSubscription.keys).
    p256dh: text('p256dh').notNull(),
    auth: text('auth').notNull(),
    // 구독 기기 식별/디버깅용 (어떤 브라우저인지).
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    // soft delete — 만료/해지 구독은 row 보존 후 조회 제외 (hard delete 금지 규약).
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => [index('idx_push_subscriptions_user').on(t.userId)],
);

export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type NewPushSubscription = typeof pushSubscriptions.$inferInsert;
