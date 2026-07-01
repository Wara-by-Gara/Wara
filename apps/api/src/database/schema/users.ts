import { pgTable, text, varchar, integer, timestamp, jsonb, boolean, uniqueIndex, type AnyPgColumn } from 'drizzle-orm/pg-core';
import { ulid } from 'ulid';
import { genderEnum, userRoleEnum, socialProviderEnum, locationTierEnum } from './enums';

export const users = pgTable('users', {
  id: text('id').primaryKey().$defaultFn(() => ulid()),
  email: varchar('email', { length: 255 }),
  profileImageUrl: text('profile_image_url'),
  profileImageThumbnailKey: text('profile_image_thumbnail_key'),
  name: varchar('name', { length: 100 }),
  nickname: varchar('nickname', { length: 20 }),
  birthYear: integer('birth_year'),
  gender: genderEnum('gender'),
  role: userRoleEnum('role').notNull().default('member'),
  defaultLocationTier: locationTierEnum('default_location_tier').notNull().default('full'), /** 위치 공유 기본 프라이버시 티어 */
  promotedBy: text('promoted_by').references((): AnyPgColumn => users.id),
  promotedAt: timestamp('promoted_at', { withTimezone: true }),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  refreshToken: text('refresh_token'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  // 탈퇴 사유 — soft delete 시 함께 기록. 분석/개선 피드백 용도이므로 nullable.
  withdrawalReason: varchar('withdrawal_reason', { length: 32 }),
  withdrawalDetail: text('withdrawal_detail'),
});

export const socialAccounts = pgTable('social_accounts', {
  id: text('id').primaryKey().$defaultFn(() => ulid()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  provider: socialProviderEnum('provider').notNull(),
  providerAccountId: text('provider_account_id').notNull(),
  rawProfile: jsonb('raw_profile'),
  appleRefreshToken: text('apple_refresh_token'),
  isPrivateEmail: boolean('is_private_email').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex('uq_social_accounts_user_provider').on(t.userId, t.provider),
  uniqueIndex('uq_social_accounts_provider_account').on(t.provider, t.providerAccountId),
]);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type SocialAccount = typeof socialAccounts.$inferSelect;
export type NewSocialAccount = typeof socialAccounts.$inferInsert;
