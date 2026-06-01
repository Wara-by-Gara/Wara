ALTER TYPE "public"."notification_type" ADD VALUE 'mention';--> statement-breakpoint
CREATE TABLE "ai_image_jobs" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"invitation_id" text NOT NULL,
	"uploaded_image_key" text NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"result_key" text,
	"error_code" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "invitations" ALTER COLUMN "main_image_key" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "feedbacks" ALTER COLUMN "content" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "invitations" ADD COLUMN "main_gif_url" text;--> statement-breakpoint
ALTER TABLE "feedbacks" ADD COLUMN "gif_url" text;--> statement-breakpoint
ALTER TABLE "ai_image_jobs" ADD CONSTRAINT "ai_image_jobs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_image_jobs" ADD CONSTRAINT "ai_image_jobs_invitation_id_invitations_id_fk" FOREIGN KEY ("invitation_id") REFERENCES "public"."invitations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_ai_jobs_user_created" ON "ai_image_jobs" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_ai_jobs_invitation" ON "ai_image_jobs" USING btree ("invitation_id");--> statement-breakpoint
CREATE INDEX "idx_ai_jobs_status" ON "ai_image_jobs" USING btree ("status");--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "check_image_or_gif" CHECK ("invitations"."main_image_key" IS NOT NULL OR "invitations"."main_gif_url" IS NOT NULL);--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "check_gif_xor_image" CHECK ("invitations"."main_gif_url" IS NULL OR "invitations"."main_image_key" IS NULL);--> statement-breakpoint
ALTER TABLE "feedbacks" ADD CONSTRAINT "check_content_or_gif" CHECK (("feedbacks"."content" IS NOT NULL AND "feedbacks"."content" <> '') OR "feedbacks"."gif_url" IS NOT NULL);--> statement-breakpoint
ALTER TABLE "feedbacks" ADD CONSTRAINT "check_gif_xor_photo" CHECK ("feedbacks"."gif_url" IS NULL OR "feedbacks"."attached_photo_id" IS NULL);
