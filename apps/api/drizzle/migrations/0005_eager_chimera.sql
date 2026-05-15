CREATE TABLE "invitation_blocklists" (
	"id" text PRIMARY KEY NOT NULL,
	"invitation_id" text NOT NULL,
	"blocked_user_id" text NOT NULL,
	"blocked_by_user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "invitation_blocklists" ADD CONSTRAINT "invitation_blocklists_invitation_id_invitations_id_fk" FOREIGN KEY ("invitation_id") REFERENCES "public"."invitations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation_blocklists" ADD CONSTRAINT "invitation_blocklists_blocked_user_id_users_id_fk" FOREIGN KEY ("blocked_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation_blocklists" ADD CONSTRAINT "invitation_blocklists_blocked_by_user_id_users_id_fk" FOREIGN KEY ("blocked_by_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_blocklist_active" ON "invitation_blocklists" USING btree ("invitation_id","blocked_user_id") WHERE "invitation_blocklists"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_blocklist_invitation" ON "invitation_blocklists" USING btree ("invitation_id");