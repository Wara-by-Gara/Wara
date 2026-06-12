import { pgTable, text, varchar, timestamp, index } from 'drizzle-orm/pg-core';
import { ulid } from 'ulid';
import { users } from './users';

export const AI_GENERATION_STATUSES = ['pending', 'processing', 'completed', 'failed'] as const;
export type AiGenerationStatus = (typeof AI_GENERATION_STATUSES)[number];

// 초대장 만들기 페이지에서 사용자가 업로드한 사진과 선택된 템플릿 배경을 AI로 합성한 결과를 기록.
// 기존 ai_image_jobs도 같은 합성을 수행하지만, 그쪽은 결과를 invitation의 메인 이미지로 자동 적용.
// 본 테이블은 결과를 메인 이미지에 적용하지 않고 다운로드 URL만 제공한다(invitation 미생성 단계).
// 한도(AI_DAILY_LIMIT=3)는 두 테이블 합산으로 공유.
export const aiGenerations = pgTable(
  'ai_generations',
  {
    id: text('id').primaryKey().$defaultFn(() => ulid()),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    templateId: text('template_id').notNull(),
    sourceImageKey: text('source_image_key').notNull(),
    // 임시 S3 키. TTL 1시간 후 만료. 만료 후에도 status는 completed 유지.
    resultImageKey: text('result_image_key'),
    status: varchar('status', { length: 20 }).notNull().default('pending'),
    errorCode: text('error_code'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
  },
  (t) => [
    index('idx_ai_generations_user_created').on(t.userId, t.createdAt),
    index('idx_ai_generations_status').on(t.status),
  ],
);

export type AiGeneration = typeof aiGenerations.$inferSelect;
export type NewAiGeneration = typeof aiGenerations.$inferInsert;
