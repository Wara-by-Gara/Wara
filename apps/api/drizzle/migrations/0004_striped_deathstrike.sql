DROP INDEX "idx_invitations_user_deleted";--> statement-breakpoint
CREATE INDEX "idx_invitations_user_deleted" ON "invitations" USING btree ("user_id") WHERE "invitations"."deleted_at" IS NULL;