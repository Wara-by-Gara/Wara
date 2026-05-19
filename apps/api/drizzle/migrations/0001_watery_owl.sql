CREATE TYPE "public"."link_event_type" AS ENUM('opened', 'joined');--> statement-breakpoint
CREATE TABLE "invitation_link_events" (
	"id" text PRIMARY KEY NOT NULL,
	"log_id" text NOT NULL,
	"event_type" "link_event_type" NOT NULL,
	"user_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "participants" ALTER COLUMN "rsvp_status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "participants" ALTER COLUMN "rsvp_status" SET DEFAULT 'undecided'::text;--> statement-breakpoint
DROP TYPE "public"."rsvp_status";--> statement-breakpoint
CREATE TYPE "public"."rsvp_status" AS ENUM('attending', 'undecided', 'absent');--> statement-breakpoint
ALTER TABLE "participants" ALTER COLUMN "rsvp_status" SET DEFAULT 'undecided'::"public"."rsvp_status";--> statement-breakpoint
ALTER TABLE "participants" ALTER COLUMN "rsvp_status" SET DATA TYPE "public"."rsvp_status" USING "rsvp_status"::"public"."rsvp_status";--> statement-breakpoint
ALTER TABLE "invitation_send_logs" ALTER COLUMN "invite_url" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "participants" ADD COLUMN "is_hidden" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "invitation_link_events" ADD CONSTRAINT "invitation_link_events_log_id_invitation_send_logs_id_fk" FOREIGN KEY ("log_id") REFERENCES "public"."invitation_send_logs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation_link_events" ADD CONSTRAINT "invitation_link_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_link_events_log_id" ON "invitation_link_events" USING btree ("log_id");--> statement-breakpoint
CREATE INDEX "idx_link_events_type" ON "invitation_link_events" USING btree ("event_type");--> statement-breakpoint
ALTER TABLE "invitation_send_logs" DROP COLUMN "status";--> statement-breakpoint
DROP TYPE "public"."send_status";