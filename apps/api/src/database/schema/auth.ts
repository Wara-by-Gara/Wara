import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { ulid } from 'ulid';
import { socialProviderEnum } from './enums';

export const oauthStates = pgTable('oauth_states', {
  id: text('id').primaryKey().$defaultFn(() => ulid()),
  state: text('state').notNull().unique(),
  provider: socialProviderEnum('provider').notNull(),
  redirectUri: text('redirect_uri'),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type OauthState = typeof oauthStates.$inferSelect;
export type NewOauthState = typeof oauthStates.$inferInsert;
