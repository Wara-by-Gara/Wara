CREATE INDEX "idx_blocklist_blocked_user_id" ON "invitation_blocklists" USING btree ("blocked_user_id");--> statement-breakpoint
CREATE INDEX "idx_blocklist_blocked_by_user_id" ON "invitation_blocklists" USING btree ("blocked_by_user_id");--> statement-breakpoint
CREATE INDEX "idx_participant_locations_participant_id" ON "participant_locations" USING btree ("participant_id");
