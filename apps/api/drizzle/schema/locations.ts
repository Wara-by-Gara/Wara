import { pgTable, text, varchar, timestamp, doublePrecision, boolean } from 'drizzle-orm/pg-core';
import { ulid } from 'ulid';
import { invitations, participants } from './invitations';

// 단방향 FK — invitation 쪽에서 event_locations_id 제거, 이 테이블이 소유
export const eventLocations = pgTable('event_locations', {
  id: text('id').primaryKey().$defaultFn(() => ulid()),
  invitationId: text('invitation_id').notNull().references(() => invitations.id, { onDelete: 'cascade' }),
  address: text('address').notNull(),
  placeName: varchar('place_name', { length: 100 }).notNull(),
  detailAddress: text('detail_address').notNull(),
  lat: doublePrecision('lat').notNull(),
  lng: doublePrecision('lng').notNull(),
  placeId: text('place_id').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const participantLocations = pgTable('participant_locations', {
  id: text('id').primaryKey().$defaultFn(() => ulid()),
  invitationId: text('invitation_id').notNull().references(() => invitations.id, { onDelete: 'cascade' }),
  participantId: text('participant_id').notNull().references(() => participants.id, { onDelete: 'cascade' }),
  accuracy: doublePrecision('accuracy').notNull(),
  lat: doublePrecision('lat').notNull(),
  lng: doublePrecision('lng').notNull(),
  isArrived: boolean('is_arrived').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type EventLocation = typeof eventLocations.$inferSelect;
export type ParticipantLocation = typeof participantLocations.$inferSelect;
