import { pgTable, text, timestamp, index } from 'drizzle-orm/pg-core';
import { ulid } from 'ulid';
import { users } from './users';
import { devicePlatformEnum } from './enums';

// 네이티브 푸시(Expo Push)용 기기 토큰. 한 유저가 여러 기기에서 등록 가능 (폰 + 태블릿 등).
// token이 Expo Push Token(ExponentPushToken[...]) — 재설치/토큰 회전 시 upsert 키.
// 만료 토큰은 Expo가 DeviceNotRegistered로 응답 → soft delete로 정리 (web-push 404/410과 동형).
export const deviceTokens = pgTable(
  'device_tokens',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => ulid()),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    // Expo Push Token. 기기/설치 고유 — 재등록 시 upsert 키.
    token: text('token').notNull().unique(),
    platform: devicePlatformEnum('platform').notNull(),
    // 같은 기기 재등록/토큰 갱신 판별용. deviceName은 중복 가능하므로 식별은 deviceId로.
    deviceId: text('device_id'),
    // 사람이 읽는 기기명 (예: "iPhone 16 Pro") — 디버깅·기기 목록 표시용.
    deviceName: text('device_name'),
    // 앱 버전 — 디버깅·강제 업데이트 판단.
    appVersion: text('app_version'),
    // 등록/재동기화 시각 — 오래된(죽은) 토큰 정리 기준.
    lastSeenAt: timestamp('last_seen_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    // soft delete — 만료/해지 토큰은 row 보존 후 조회 제외 (hard delete 금지 규약).
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => [index('idx_device_tokens_user').on(t.userId)],
);

export type DeviceToken = typeof deviceTokens.$inferSelect;
export type NewDeviceToken = typeof deviceTokens.$inferInsert;
