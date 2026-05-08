import { pgTable, text, integer, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { ulid } from 'ulid';
import { invitations, participants } from './invitations';
import { missions } from './missions';

export const photos = pgTable('photos', {
  id: text('id').primaryKey().$defaultFn(() => ulid()),
  participantId: text('participant_id').notNull().references(() => participants.id, { onDelete: 'cascade' }),
  invitationId: text('invitation_id').notNull().references(() => invitations.id, { onDelete: 'cascade' }),
  missionId: text('mission_id').references(() => missions.id, { onDelete: 'set null' }),
  imageKey: text('image_key').notNull(),
  exifMetadata: jsonb('exif_metadata'),
  viewCount: integer('view_count').notNull().default(0),
  likeCount: integer('like_count').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});

export const photoLikes = pgTable('photo_likes', {
  id: text('id').primaryKey().$defaultFn(() => ulid()),
  photoId: text('photo_id').notNull().references(() => photos.id, { onDelete: 'cascade' }),
  participantId: text('participant_id').notNull().references(() => participants.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type Photo = typeof photos.$inferSelect;
export type NewPhoto = typeof photos.$inferInsert;
export type PhotoLike = typeof photoLikes.$inferSelect;
