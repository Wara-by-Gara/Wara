ALTER TYPE "public"."notification_type" ADD VALUE 'text_blast';--> statement-breakpoint
CREATE TABLE "text_blasts" (
	"id" text PRIMARY KEY NOT NULL,
	"invitation_id" text NOT NULL,
	"sender_user_id" text,
	"message" text NOT NULL,
	"recipient_count" text DEFAULT '0' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "text_blasts" ADD CONSTRAINT "text_blasts_invitation_id_invitations_id_fk" FOREIGN KEY ("invitation_id") REFERENCES "public"."invitations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "text_blasts" ADD CONSTRAINT "text_blasts_sender_user_id_users_id_fk" FOREIGN KEY ("sender_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_text_blasts_invitation" ON "text_blasts" USING btree ("invitation_id");
