import { pgTable, text, integer, timestamp, varchar, index } from 'drizzle-orm/pg-core';
import { ulid } from 'ulid';

// 폴리모픽 타겟: 본 PR은 'photo'만 사용. 후속 PR(invitation_main/user_profile 등)이
// 동일 테이블을 재사용하도록 targetType+targetId 조합으로 분기.
// FK는 두지 않음(폴리모픽이라 불가). 청소는 status='completed' & completedAt 기준 cron.
export const IMAGE_JOB_TARGET_TYPES = [
  'photo',
  'invitation_main',
  'user_profile',
] as const;
export type ImageJobTargetType = (typeof IMAGE_JOB_TARGET_TYPES)[number];

export const IMAGE_JOB_STATUSES = ['pending', 'processing', 'completed', 'failed'] as const;
export type ImageJobStatus = (typeof IMAGE_JOB_STATUSES)[number];

export const imageProcessingJobs = pgTable(
  'image_processing_jobs',
  {
    id: text('id').primaryKey().$defaultFn(() => ulid()),
    targetType: varchar('target_type', { length: 30 }).notNull(),
    targetId: text('target_id').notNull(),
    sourceKey: text('source_key').notNull(),
    thumbnailKey: text('thumbnail_key'),
    status: varchar('status', { length: 20 }).notNull().default('pending'),
    mimeType: text('mime_type'),
    sizeBytes: integer('size_bytes'),
    errorCode: text('error_code'),
    attempts: integer('attempts').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
  },
  (t) => [
    index('idx_image_jobs_target').on(t.targetType, t.targetId),
    index('idx_image_jobs_status').on(t.status),
  ],
);

export type ImageProcessingJob = typeof imageProcessingJobs.$inferSelect;
export type NewImageProcessingJob = typeof imageProcessingJobs.$inferInsert;
