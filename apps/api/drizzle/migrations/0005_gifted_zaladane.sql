CREATE INDEX "idx_invitations_user_id" ON "invitations" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_participants_invitation_id" ON "participants" USING btree ("invitation_id");--> statement-breakpoint
ALTER TABLE "participants" DROP COLUMN "display_name";