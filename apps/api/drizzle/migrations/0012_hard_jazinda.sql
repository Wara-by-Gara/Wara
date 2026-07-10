CREATE TYPE "public"."location_tier" AS ENUM('full', 'distance', 'hidden');--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "default_location_tier" "location_tier" DEFAULT 'full' NOT NULL;--> statement-breakpoint
ALTER TABLE "participants" ADD COLUMN "location_tier" "location_tier";