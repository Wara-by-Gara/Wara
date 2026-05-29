DO $$ BEGIN
  CREATE TYPE "public"."date_vote_poll_status" AS ENUM('open', 'closed', 'confirmed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."date_vote_response" AS ENUM('good', 'maybe', 'bad');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE IF NOT EXISTS 'nudge';--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE IF NOT EXISTS 'vote_reminder';--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE IF NOT EXISTS 'vote_confirmed';--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE IF NOT EXISTS 'vote_tied';--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "date_vote_polls" (
	"id" text PRIMARY KEY NOT NULL,
	"invitation_id" text NOT NULL,
	"closes_at" timestamp with time zone NOT NULL,
	"status" date_vote_poll_status DEFAULT 'open' NOT NULL,
	"is_anonymous" boolean DEFAULT false NOT NULL,
	"confirmed_slot_id" text,
	"reminder_sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "date_vote_responses" (
	"id" text PRIMARY KEY NOT NULL,
	"slot_id" text NOT NULL,
	"participant_id" text NOT NULL,
	"response" date_vote_response NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "date_vote_slots" (
	"id" text PRIMARY KEY NOT NULL,
	"poll_id" text NOT NULL,
	"date" date NOT NULL,
	"start_time" varchar(5),
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "date_vote_polls" ADD CONSTRAINT "date_vote_polls_invitation_id_invitations_id_fk" FOREIGN KEY ("invitation_id") REFERENCES "public"."invitations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "date_vote_responses" ADD CONSTRAINT "date_vote_responses_slot_id_date_vote_slots_id_fk" FOREIGN KEY ("slot_id") REFERENCES "public"."date_vote_slots"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "date_vote_responses" ADD CONSTRAINT "date_vote_responses_participant_id_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."participants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "date_vote_slots" ADD CONSTRAINT "date_vote_slots_poll_id_date_vote_polls_id_fk" FOREIGN KEY ("poll_id") REFERENCES "public"."date_vote_polls"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_date_vote_polls_invitation" ON "date_vote_polls" USING btree ("invitation_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_date_vote_polls_status" ON "date_vote_polls" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_date_vote_polls_closes_at" ON "date_vote_polls" USING btree ("closes_at");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_date_vote_responses_slot_participant" ON "date_vote_responses" USING btree ("slot_id","participant_id");
