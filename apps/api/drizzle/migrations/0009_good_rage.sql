CREATE TYPE "public"."remind_type" AS ENUM('D+7', 'D+30', 'D+365');--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'nudge' BEFORE 'vote_reminder';--> statement-breakpoint
CREATE TABLE "remind_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"invitation_id" text NOT NULL,
	"remind_type" "remind_type" NOT NULL,
	"sent_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "nickname" SET DATA TYPE varchar(20);--> statement-breakpoint
ALTER TABLE "invitations" ADD COLUMN "bg_color" varchar(50) DEFAULT 'bg-white' NOT NULL;--> statement-breakpoint
ALTER TABLE "invitations" ADD COLUMN "font" varchar(50) DEFAULT 'default' NOT NULL;--> statement-breakpoint
ALTER TABLE "remind_logs" ADD CONSTRAINT "remind_logs_invitation_id_invitations_id_fk" FOREIGN KEY ("invitation_id") REFERENCES "public"."invitations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_remind_logs_invitation_type" ON "remind_logs" USING btree ("invitation_id","remind_type");--> statement-breakpoint
CREATE INDEX "idx_remind_logs_invitation" ON "remind_logs" USING btree ("invitation_id");