import { pgTable, text, varchar, timestamp, doublePrecision, boolean, check, uniqueIndex } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { ulid } from 'ulid';
import { invitations, participants } from './invitations';

// 단방향 FK — invitation 쪽에서 event_locations_id 제거, 이 테이블이 소유
export const eventLocations = pgTable('event_locations', {
  id: text('id').primaryKey().$defaultFn(() => ulid()),
  invitationId: text('invitation_id').notNull().references(() => invitations.id, { onDelete: 'cascade' }).unique(),
  address: text('address').notNull(),
  placeName: varchar('place_name', { length: 100 }).notNull(),
  detailAddress: text('detail_address').notNull(),
  lat: doublePrecision('lat').notNull(),
  lng: doublePrecision('lng').notNull(),
  placeId: text('place_id').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (t) => [
  check('check_event_location_coords', sql`${t.lat} >= -90 AND ${t.lat} <= 90 AND ${t.lng} >= -180 AND ${t.lng} <= 180`),
]);

export const participantLocations = pgTable('participant_locations', {
  id: text('id').primaryKey().$defaultFn(() => ulid()),
  invitationId: text('invitation_id').notNull().references(() => invitations.id, { onDelete: 'cascade' }),
  participantId: text('participant_id').notNull().references(() => participants.id, { onDelete: 'cascade' }),
  accuracy: doublePrecision('accuracy').notNull(),
  lat: doublePrecision('lat').notNull(),
  lng: doublePrecision('lng').notNull(),
  isArrived: boolean('is_arrived').notNull().default(false),
  // 미도착 멤버가 broadcast하는 짧은 상태 텍스트 (예: "5분 늦어요"). 위치 공유 중에만 의미 있음.
  statusMessage: varchar('status_message', { length: 100 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex('uq_participant_locations_participant_invitation').on(t.invitationId, t.participantId),
  check('check_participant_location_coords', sql`${t.lat} >= -90 AND ${t.lat} <= 90 AND ${t.lng} >= -180 AND ${t.lng} <= 180`),
  check('check_participant_location_accuracy', sql`${t.accuracy} >= 0`),
]);

export type EventLocation = typeof eventLocations.$inferSelect;
export type ParticipantLocation = typeof participantLocations.$inferSelect;
