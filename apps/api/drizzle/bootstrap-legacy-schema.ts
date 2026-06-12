/**
 * 구 RDS(0000 hash 불일치·부분 적용)에서 CREATE TABLE skip 후
 * FK/제약 추가가 실패하는 누락 컬럼을 idempotent로 보정한다.
 */
import type postgres from 'postgres';

const DRIFT_FIXES: string[] = [
  `ALTER TABLE "feedbacks" ADD COLUMN IF NOT EXISTS "attached_photo_id" text`,
  `ALTER TABLE "feedbacks" ADD COLUMN IF NOT EXISTS "gif_url" text`,
  `ALTER TABLE "invitation_templates" ADD COLUMN IF NOT EXISTS "prompt" text DEFAULT '왼쪽 이미지의 인물을 오른쪽 이미지의 초대장 배경 디자인에 자연스럽게 합성해 주세요. 배경 디자인과 분위기를 최대한 유지하면서 인물을 배경에 어울리게 배치해 주세요.'`,
  `ALTER TABLE "event_locations" ADD COLUMN IF NOT EXISTS "deleted_at" timestamp with time zone`,
  `ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "invitation_id" text`,
  `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "withdrawal_reason" varchar(32)`,
  `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "withdrawal_detail" text`,
  `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "profile_image_thumbnail_key" text`,
  `ALTER TABLE "invitations" ADD COLUMN IF NOT EXISTS "main_cover_type" "main_cover_type" DEFAULT 'image'`,
  `ALTER TABLE "invitations" ADD COLUMN IF NOT EXISTS "main_gif_url" text`,
  `ALTER TABLE "invitations" ADD COLUMN IF NOT EXISTS "is_public" boolean DEFAULT false`,
  `ALTER TABLE "invitations" ADD COLUMN IF NOT EXISTS "category" varchar(20)`,
  `ALTER TABLE "invitations" ADD COLUMN IF NOT EXISTS "main_image_thumbnail_key" text`,
  `ALTER TABLE "invitations" ADD COLUMN IF NOT EXISTS "animation" varchar(50)`,
  `ALTER TABLE "invitations" ADD COLUMN IF NOT EXISTS "fee" varchar(100)`,
  `ALTER TABLE "invitations" ADD COLUMN IF NOT EXISTS "dress_code" varchar(100)`,
  `ALTER TABLE "invitations" ADD COLUMN IF NOT EXISTS "parking_info" text`,
  `ALTER TABLE "invitations" ADD COLUMN IF NOT EXISTS "view_count" integer DEFAULT 0`,
  `ALTER TABLE "photos" ADD COLUMN IF NOT EXISTS "exif_fingerprint" text`,
  `ALTER TABLE "photos" ADD COLUMN IF NOT EXISTS "thumbnail_key" text`,
  `ALTER TABLE "participant_locations" ADD COLUMN IF NOT EXISTS "status_message" varchar(100)`,
  `ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "reply_to_message_id" text`,
  `ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "edited_at" timestamp with time zone`,
  `ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "image_key" text`,
  `ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "type" text DEFAULT 'user'`,
  `ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "type" text DEFAULT 'direct'`,
  `ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "title" text`,
  `ALTER TABLE "conversation_participants" ADD COLUMN IF NOT EXISTS "left_at" timestamp with time zone`,
  `ALTER TABLE "conversation_participants" ADD COLUMN IF NOT EXISTS "alias" text`,
  `ALTER TABLE "conversation_participants" ADD COLUMN IF NOT EXISTS "joined_at" timestamp with time zone`,
  `ALTER TABLE "service_terms" ADD COLUMN IF NOT EXISTS "document_id" varchar(64)`,
  `ALTER TABLE "service_terms" ADD COLUMN IF NOT EXISTS "effective_date" timestamp with time zone`,
];

export async function isLegacyBootstrappedDb(client: postgres.Sql): Promise<boolean> {
  const rows = await client.unsafe<{ exists: boolean }[]>(
    `SELECT to_regclass('public.users') IS NOT NULL AS exists`,
  );
  return rows[0]?.exists === true;
}

export async function bootstrapLegacySchema(client: postgres.Sql): Promise<void> {
  process.stdout.write('[migrate] legacy schema drift 보정 중...\n');
  for (const sql of DRIFT_FIXES) {
    try {
      await client.unsafe(sql);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (/does not exist|undefined_table/i.test(message)) {
        process.stdout.write(`[migrate]   drift skip (no table): ${message}\n`);
        continue;
      }
      if (/already exists|duplicate/i.test(message)) {
        process.stdout.write(`[migrate]   drift skip: ${message}\n`);
        continue;
      }
      throw err;
    }
  }
  process.stdout.write('[migrate] legacy schema drift 보정 완료\n');
}
