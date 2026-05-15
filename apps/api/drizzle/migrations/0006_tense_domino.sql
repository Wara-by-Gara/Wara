ALTER TYPE "public"."social_provider" ADD VALUE 'google' BEFORE 'kakao';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "refresh_token" text;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_participant_locations_participant_invitation" ON "participant_locations" USING btree ("invitation_id","participant_id");