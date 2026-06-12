import { pgTable, text, integer, timestamp, jsonb, uniqueIndex, check, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { ulid } from 'ulid';
import { invitations, participants } from './invitations';


export const photos = pgTable('photos', {
  id: text('id').primaryKey().$defaultFn(() => ulid()),
  participantId: text('participant_id').notNull().references(() => participants.id, { onDelete: 'cascade' }),
  invitationId: text('invitation_id').notNull().references(() => invitations.id, { onDelete: 'cascade' }),
  imageKey: text('image_key').notNull(),
  thumbnailKey: text('thumbnail_key'),
  takenAt: timestamp('taken_at', { withTimezone:true }),
  exifMetadata: jsonb('exif_metadata'),
  viewCount: integer('view_count').notNull().default(0),
  likeCount: integer('like_count').notNull().default(0),
  feedbackCount: integer('feedback_count').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  exifFingerprint: text('exif_fingerprint'),
}, (t) => [
  check('check_photo_view_count', sql`${t.viewCount} >= 0`),
  check('check_photo_like_count', sql`${t.likeCount} >= 0`),
  check('check_photo_feedback_count', sql`${t.feedbackCount} >= 0`),
  index('idx_photos_invitation_taken_at').on(t.invitationId, t.takenAt),
  index('idx_photos_deleted_at').on(t.deletedAt),
  uniqueIndex('uq_photos_invitation_fingerprint').on(t.invitationId, t.exifFingerprint),
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
