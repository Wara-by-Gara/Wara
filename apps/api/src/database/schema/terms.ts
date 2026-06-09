import { pgTable, text, varchar, boolean, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { ulid } from 'ulid';
import { termTypeEnum } from './enums';
import { users } from './users';

export const serviceTerms = pgTable('service_terms', {
  id: text('id').primaryKey().$defaultFn(() => ulid()),
  // docs/legal/*.md frontmatter의 documentId — 마크다운 SoT와 DB row를 잇는 안정적 식별자
  documentId: varchar('document_id', { length: 64 }).notNull(),
  termType: termTypeEnum('term_type').notNull(),
  version: varchar('version', { length: 20 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content').notNull(),
  isActive: boolean('is_active').notNull().default(false),
  isRequired: boolean('is_required').notNull().default(false),
  effectiveDate: timestamp('effective_date', { withTimezone: true }).notNull(),
  publishedAt: timestamp('published_at', { withTimezone: true }).notNull(),
  createdBy: text('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (t) => [
  uniqueIndex('uq_service_terms_document_id').on(t.documentId),
]);

export const userTermAgreements = pgTable('user_term_agreements', {
  id: text('id').primaryKey().$defaultFn(() => ulid()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  termId: text('term_id').notNull().references(() => serviceTerms.id, { onDelete: 'cascade' }),
  agreedAt: timestamp('agreed_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex('uq_user_term_agreements_user_term').on(t.userId, t.termId),
]);

export type ServiceTerm = typeof serviceTerms.$inferSelect;
export type NewServiceTerm = typeof serviceTerms.$inferInsert;
export type UserTermAgreement = typeof userTermAgreements.$inferSelect;
