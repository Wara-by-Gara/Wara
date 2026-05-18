ALTER TABLE "photos" ADD COLUMN "taken_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "photos" ADD COLUMN "feedback_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_photos_invitation_taken_at" ON "photos" USING btree ("invitation_id","taken_at");--> statement-breakpoint
CREATE INDEX "idx_photos_deleted_at" ON "photos" USING btree ("deleted_at");--> statement-breakpoint
ALTER TABLE "photos" ADD CONSTRAINT "check_photo_feedback_count" CHECK ("photos"."feedback_count" >= 0);