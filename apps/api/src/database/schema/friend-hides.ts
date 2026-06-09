import { pgTable, text, timestamp, primaryKey, index } from 'drizzle-orm/pg-core';
import { users } from './users';

// 친구 삭제(영구 숨김) — 내가 숨긴 사용자. 친구 목록 쿼리에서 제외.
// 친구는 공동참여로 파생되므로 관계 row가 없어, 숨김 기록으로 제외한다.
export const friendHides = pgTable(
  'friend_hides',
  {
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    hiddenUserId: text('hidden_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.hiddenUserId] }),
    index('idx_friend_hides_user').on(t.userId),
  ],
);

export type FriendHide = typeof friendHides.$inferSelect;
