ALTER TYPE "public"."notification_type" ADD VALUE 'inquiry_answer';--> statement-breakpoint
ALTER TABLE "notification_settings" ADD COLUMN "is_inquiry_answer" boolean DEFAULT true NOT NULL;
