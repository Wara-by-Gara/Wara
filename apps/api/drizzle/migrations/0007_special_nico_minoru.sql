ALTER TABLE "participants" ALTER COLUMN "rsvp_status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "participants" ALTER COLUMN "rsvp_status" SET DEFAULT 'undecided'::text;--> statement-breakpoint
DROP TYPE "public"."rsvp_status";--> statement-breakpoint
CREATE TYPE "public"."rsvp_status" AS ENUM('attending', 'undecided', 'absent');--> statement-breakpoint
ALTER TABLE "participants" ALTER COLUMN "rsvp_status" SET DEFAULT 'undecided'::"public"."rsvp_status";--> statement-breakpoint
ALTER TABLE "participants" ALTER COLUMN "rsvp_status" SET DATA TYPE "public"."rsvp_status" USING "rsvp_status"::"public"."rsvp_status";--> statement-breakpoint
ALTER TABLE "participants" ADD COLUMN "is_hidden" boolean DEFAULT false NOT NULL;--> statement-breakpoint
