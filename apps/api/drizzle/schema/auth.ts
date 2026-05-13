import { pgTable, text, timestamp, index } from 'drizzle-orm/pg-core';
import { ulid } from 'ulid';
import { socialProviderEnum } from './enums';
import { users } from './users';

export const refreshTokens = pgTable('refresh_tokens', {
  id: text('id').primaryKey().$defaultFn(() => ulid()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_refresh_tokens_user').on(t.userId),
]);

export const oauthStates = pgTable('oauth_states', {
  id: text('id').primaryKey().$defaultFn(() => ulid()),
  state: text('state').notNull().unique(),
  provider: socialProviderEnum('provider').notNull(),
  redirectUri: text('redirect_uri'),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type RefreshToken = typeof refreshTokens.$inferSelect;
export type NewRefreshToken = typeof refreshTokens.$inferInsert;
export type OauthState = typeof oauthStates.$inferSelect;
export type NewOauthState = typeof oauthStates.$inferInsert;
