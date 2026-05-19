import { pgTable, text, varchar, timestamp, index } from 'drizzle-orm/pg-core';
import { ulid } from 'ulid';
import { inquiryTypeEnum, inquiryStatusEnum } from './enums';
import { users } from './users';
import { sql } from 'drizzle-orm';

export const inquiries = pgTable('inquiries', {
  id: text('id').primaryKey().$defaultFn(() => ulid()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  inquiryType: inquiryTypeEnum('inquiry_type').notNull(),
  status: inquiryStatusEnum('status').notNull().default('pending'),
  title: varchar('title', { length: 200 }).notNull(),
  content: text('content').notNull(),
  answer: text('answer'),
  answeredAt: timestamp('answered_at', { withTimezone: true }),
  adminId: text('admin_id').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (t) => [
  index('idx_inquiries_user_id').on(t.userId),
  index('idx_inquiries_deleted_at').on(t.deletedAt).where(sql`${t.deletedAt} IS NULL`),
]);

export type Inquiry = typeof inquiries.$inferSelect;
export type NewInquiry = typeof inquiries.$inferInsert;
