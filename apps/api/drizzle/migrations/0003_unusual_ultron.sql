ALTER TABLE "photos" DROP CONSTRAINT "photos_mission_id_missions_id_fk";
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "refresh_token" text;--> statement-breakpoint
ALTER TABLE "missions" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "photos" DROP COLUMN "mission_id";