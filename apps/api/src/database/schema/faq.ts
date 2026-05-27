import { pgTable, text, integer, boolean, timestamp } from 'drizzle-orm/pg-core';
import { ulid } from 'ulid';
import { users } from './users';

export const faqItems = pgTable('faq_items', {
  id: text('id').primaryKey().$defaultFn(() => ulid()),
  question: text('question').notNull(),
  answer: text('answer').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  createdBy: text('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});

export type FaqItem = typeof faqItems.$inferSelect;
export type NewFaqItem = typeof faqItems.$inferInsert;
