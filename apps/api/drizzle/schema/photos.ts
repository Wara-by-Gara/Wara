import { pgTable, text, integer, timestamp, jsonb, uniqueIndex, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { ulid } from 'ulid';
import { invitations, participants } from './invitations';

export const photos = pgTable('photos', {
  id: text('id').primaryKey().$defaultFn(() => ulid()),
  participantId: text('participant_id').notNull().references(() => participants.id, { onDelete: 'cascade' }),
  invitationId: text('invitation_id').notNull().references(() => invitations.id, { onDelete: 'cascade' }),
  imageKey: text('image_key').notNull(),
  exifMetadata: jsonb('exif_metadata'),
  viewCount: integer('view_count').notNull().default(0),
  likeCount: integer('like_count').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (t) => [
  check('check_photo_view_count', sql`${t.viewCount} >= 0`),
  check('check_photo_like_count', sql`${t.likeCount} >= 0`),
]);

export const photoLikes = pgTable('photo_likes', {
  id: text('id').primaryKey().$defaultFn(() => ulid()),
  photoId: text('photo_id').notNull().references(() => photos.id, { onDelete: 'cascade' }),
  participantId: text('participant_id').notNull().references(() => participants.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex('uq_photo_likes_photo_participant').on(t.photoId, t.participantId),
]);

export type Photo = typeof photos.$inferSelect;
export type NewPhoto = typeof photos.$inferInsert;
export type PhotoLike = typeof photoLikes.$inferSelect;
