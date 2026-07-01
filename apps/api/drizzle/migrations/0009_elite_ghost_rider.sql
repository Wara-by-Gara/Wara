CREATE TYPE "public"."date_vote_type" AS ENUM('date', 'custom');--> statement-breakpoint
DROP INDEX "uq_date_vote_polls_invitation";--> statement-breakpoint
ALTER TABLE "date_vote_slots" ALTER COLUMN "date" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "invitation_blocklists" ADD COLUMN "reason" text;--> statement-breakpoint
ALTER TABLE "date_vote_polls" ADD COLUMN "vote_type" date_vote_type DEFAULT 'date' NOT NULL;--> statement-breakpoint
ALTER TABLE "date_vote_polls" ADD COLUMN "title" varchar(100);--> statement-breakpoint
ALTER TABLE "date_vote_slots" ADD COLUMN "label" varchar(100);--> statement-breakpoint
CREATE INDEX "idx_date_vote_polls_invitation" ON "date_vote_polls" USING btree ("invitation_id");