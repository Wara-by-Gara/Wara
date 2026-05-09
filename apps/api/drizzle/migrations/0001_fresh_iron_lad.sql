CREATE UNIQUE INDEX "uq_social_accounts_user_provider" ON "social_accounts" USING btree ("user_id","provider");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_social_accounts_provider_account" ON "social_accounts" USING btree ("provider","provider_account_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_participants_user_invitation" ON "participants" USING btree ("user_id","invitation_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_feedback_likes_feedback_participant" ON "feedback_likes" USING btree ("feedback_id","participant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_photo_likes_photo_participant" ON "photo_likes" USING btree ("photo_id","participant_id");--> statement-breakpoint
ALTER TABLE "event_locations" ADD CONSTRAINT "event_locations_invitation_id_unique" UNIQUE("invitation_id");--> statement-breakpoint
ALTER TABLE "notification_settings" ADD CONSTRAINT "notification_settings_user_id_unique" UNIQUE("user_id");