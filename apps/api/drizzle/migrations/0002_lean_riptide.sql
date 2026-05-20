CREATE TABLE "mission_assignments" (
	"id" text PRIMARY KEY NOT NULL,
	"mission_id" text NOT NULL,
	"participant_id" text NOT NULL,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "mission_templates" (
	"id" text PRIMARY KEY NOT NULL,
	"content" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "mission_assignments" ADD CONSTRAINT "mission_assignments_mission_id_missions_id_fk" FOREIGN KEY ("mission_id") REFERENCES "public"."missions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mission_assignments" ADD CONSTRAINT "mission_assignments_participant_id_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."participants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_mission_assignments_mission_participant" ON "mission_assignments" USING btree ("mission_id","participant_id");--> statement-breakpoint
CREATE INDEX "idx_mission_assignments_participant_id" ON "mission_assignments" USING btree ("participant_id");--> statement-breakpoint
CREATE INDEX "idx_send_logs_invitation_id" ON "invitation_send_logs" USING btree ("invitation_id");--> statement-breakpoint
CREATE INDEX "idx_invitations_user_id" ON "invitations" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_invitations_user_deleted" ON "invitations" USING btree ("user_id","deleted_at");--> statement-breakpoint
CREATE INDEX "idx_participants_invitation_id" ON "participants" USING btree ("invitation_id");--> statement-breakpoint
CREATE INDEX "idx_participants_invitation_rsvp_role" ON "participants" USING btree ("invitation_id","rsvp_status","member_role");--> statement-breakpoint
CREATE INDEX "idx_missions_invitation_id" ON "missions" USING btree ("invitation_id");--> statement-breakpoint
CREATE INDEX "idx_photos_participant_id" ON "photos" USING btree ("participant_id");--> statement-breakpoint
CREATE INDEX "idx_photo_likes_participant_id" ON "photo_likes" USING btree ("participant_id");--> statement-breakpoint
CREATE INDEX "idx_feedbacks_invitation_id" ON "feedbacks" USING btree ("invitation_id");--> statement-breakpoint
CREATE INDEX "idx_feedbacks_photo_id" ON "feedbacks" USING btree ("photo_id");--> statement-breakpoint
CREATE INDEX "idx_feedbacks_participant_id" ON "feedbacks" USING btree ("participant_id");--> statement-breakpoint
CREATE INDEX "idx_notifications_user_id" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_notifications_user_unread" ON "notifications" USING btree ("user_id","is_read");