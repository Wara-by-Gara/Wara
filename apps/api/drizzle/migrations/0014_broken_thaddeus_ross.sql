CREATE TYPE "public"."main_cover_type" AS ENUM('image', 'gif');--> statement-breakpoint
ALTER TABLE "invitations" DROP CONSTRAINT "check_image_or_gif";--> statement-breakpoint
ALTER TABLE "invitations" DROP CONSTRAINT "check_gif_xor_image";--> statement-breakpoint
ALTER TABLE "invitations" ADD COLUMN "main_cover_type" "main_cover_type" DEFAULT 'image' NOT NULL;--> statement-breakpoint
UPDATE "invitations" SET "main_cover_type" = 'gif' WHERE "main_gif_url" IS NOT NULL;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "check_cover_type_image" CHECK ("invitations"."main_cover_type" <> 'image' OR ("invitations"."main_image_key" IS NOT NULL AND "invitations"."main_gif_url" IS NULL));--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "check_cover_type_gif" CHECK ("invitations"."main_cover_type" <> 'gif' OR ("invitations"."main_gif_url" IS NOT NULL AND "invitations"."main_image_key" IS NULL));