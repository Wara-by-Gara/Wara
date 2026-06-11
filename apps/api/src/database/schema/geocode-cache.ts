import { pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { ulid } from 'ulid';

export const geocodeCache = pgTable('geocode_cache', {
  id: text('id').primaryKey().$defaultFn(() => ulid()),
  latKey: text('lat_key').notNull(),   // lat.toFixed(3)
  lngKey: text('lng_key').notNull(),   // lng.toFixed(3)
  address: text('address'),            // null = 조회했으나 주소 없음
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex('uq_geocode_cache_lat_lng').on(t.latKey, t.lngKey),
]);
