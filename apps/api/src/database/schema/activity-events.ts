import { pgTable, text, timestamp, jsonb, index } from 'drizzle-orm/pg-core';
import { ulid } from 'ulid';
import { users } from './users';
import { activityEventTypeEnum } from './enums';

/**
 * 사용자 활동 이벤트 로그 (append-only).
 *
 * MAU/WAU/Retention을 정밀 측정하기 위한 단일 진실 공급원.
 * 기존 대시보드는 invitation/participant/send_log/link_event의 createdAt을 union해
 * 근사했지만, 이 테이블에 행동을 직접 적재하면 코호트/시계열을 정확히 집계할 수 있다.
 * (테이블 적재가 충분히 쌓이면 대시보드 집계를 이 테이블 기준으로 전환)
 */
export const userActivityEvents = pgTable(
  'user_activity_events',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => ulid()),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    eventType: activityEventTypeEnum('event_type').notNull(),
    // 이벤트 부가 정보(예: invitationId, channel) — 분석용, optional.
    metadata: jsonb('metadata'),
    occurredAt: timestamp('occurred_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    // 코호트/유저별 시계열 집계
    index('idx_activity_events_user_occurred').on(t.userId, t.occurredAt),
    // 이벤트 종류별 추이
    index('idx_activity_events_type_occurred').on(t.eventType, t.occurredAt),
    // 전역 일자 버킷 집계
    index('idx_activity_events_occurred').on(t.occurredAt),
  ],
);

export type UserActivityEvent = typeof userActivityEvents.$inferSelect;
export type NewUserActivityEvent = typeof userActivityEvents.$inferInsert;
