import { pgTable, text, varchar, integer, timestamp, jsonb, boolean, uniqueIndex, type AnyPgColumn } from 'drizzle-orm/pg-core';
import { ulid } from 'ulid';
import { genderEnum, userRoleEnum, socialProviderEnum } from './enums';

export const users = pgTable('users', {
  id: text('id').primaryKey().$defaultFn(() => ulid()),
  email: varchar('email', { length: 255 }),
  profileImageUrl: text('profile_image_url'),
  name: varchar('name', { length: 100 }),
  nickname: varchar('nickname', { length: 20 }),
  birthYear: integer('birth_year'),
  gender: genderEnum('gender'),
  role: userRoleEnum('role').notNull().default('member'),
  promotedBy: text('promoted_by').references((): AnyPgColumn => users.id),
  promotedAt: timestamp('promoted_at', { withTimezone: true }),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  refreshToken: text('refresh_token'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
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
