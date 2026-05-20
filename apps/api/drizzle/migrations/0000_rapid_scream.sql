CREATE TYPE "public"."gender" AS ENUM('female', 'male');--> statement-breakpoint
CREATE TYPE "public"."inquiry_status" AS ENUM('pending', 'in_progress', 'resolved');--> statement-breakpoint
CREATE TYPE "public"."inquiry_type" AS ENUM('invitation', 'photo', 'notification', 'mission', 'bug', 'feature', 'general');--> statement-breakpoint
CREATE TYPE "public"."invitation_status" AS ENUM('active', 'closed');--> statement-breakpoint
CREATE TYPE "public"."link_event_type" AS ENUM('opened', 'joined');--> statement-breakpoint
CREATE TYPE "public"."member_role" AS ENUM('HOST', 'GUEST');--> statement-breakpoint
CREATE TYPE "public"."notification_target_type" AS ENUM('photo', 'feedback', 'invitation', 'mission', 'participantLocations');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('remind', 'participantLocations', 'eventLocations', 'feedback', 'invitation_date', 'photo');--> statement-breakpoint
CREATE TYPE "public"."rsvp_status" AS ENUM('attending', 'undecided', 'absent');--> statement-breakpoint
CREATE TYPE "public"."send_channel" AS ENUM('link', 'kakao', 'sms', 'email', 'dm');--> statement-breakpoint
CREATE TYPE "public"."social_provider" AS ENUM('google', 'kakao', 'naver', 'apple');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('member', 'admin');--> statement-breakpoint
CREATE TABLE "social_accounts" (
	
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"provider" "social_provider" NOT NULL,
	"provider_account_id" text NOT NULL,
	"raw_profile" jsonb,
	"apple_refresh_token" text,
	"is_private_email" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" varchar(255),
	"profile_image_url" text,
	"name" varchar(100),
	"nickname" varchar(8),
	"birth_year" integer,
	"gender" "gender",
	"role" "user_role" DEFAULT 'member' NOT NULL,
	"promoted_by" text,
	"promoted_at" timestamp with time zone,
	"last_login_at" timestamp with time zone,
	"refresh_token" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "oauth_states" (
	"id" text PRIMARY KEY NOT NULL,
	"state" text NOT NULL,
	"provider" "social_provider" NOT NULL,
	"redirect_uri" text,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "oauth_states_state_unique" UNIQUE("state")
);
--> statement-breakpoint
CREATE TABLE "refresh_tokens" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"device_info" text,
	"ip_address" text,
	"last_used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "refresh_tokens_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "invitation_blocklists" (
	"id" text PRIMARY KEY NOT NULL,
	"invitation_id" text NOT NULL,
	"blocked_user_id" text NOT NULL,
	"blocked_by_user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "invitation_link_events" (
	"id" text PRIMARY KEY NOT NULL,
	"log_id" text NOT NULL,
	"event_type" "link_event_type" NOT NULL,
	"user_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invitation_send_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"invitation_id" text NOT NULL,
	"sender_id" text NOT NULL,
	"channel" "send_channel" NOT NULL,
	"invite_url" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invitation_templates" (
	"id" text PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"preview_image_key" text NOT NULL,
	"theme" varchar(50) NOT NULL,
	"font" varchar(50) NOT NULL,
	"effect" varchar(50),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invitations" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"template_id" text,
	"status" "invitation_status" DEFAULT 'active' NOT NULL,
	"title" varchar(100) NOT NULL,
	"description" text NOT NULL,
	"main_image_key" text NOT NULL,
	"event_start_at" timestamp with time zone,
	"is_mission_enabled" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "participants" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"invitation_id" text NOT NULL,
	"member_role" "member_role" NOT NULL,
	"rsvp_status" "rsvp_status" DEFAULT 'undecided' NOT NULL,
	"is_hidden" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_locations" (
	"id" text PRIMARY KEY NOT NULL,
	"invitation_id" text NOT NULL,
	"address" text NOT NULL,
	"place_name" varchar(100) NOT NULL,
	"detail_address" text NOT NULL,
	"lat" double precision NOT NULL,
	"lng" double precision NOT NULL,
	"place_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "event_locations_invitation_id_unique" UNIQUE("invitation_id"),
	CONSTRAINT "check_event_location_coords" CHECK ("event_locations"."lat" >= -90 AND "event_locations"."lat" <= 90 AND "event_locations"."lng" >= -180 AND "event_locations"."lng" <= 180)
);
--> statement-breakpoint
CREATE TABLE "participant_locations" (
	"id" text PRIMARY KEY NOT NULL,
	"invitation_id" text NOT NULL,
	"participant_id" text NOT NULL,
	"accuracy" double precision NOT NULL,
	"lat" double precision NOT NULL,
	"lng" double precision NOT NULL,
	"is_arrived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "check_participant_location_coords" CHECK ("participant_locations"."lat" >= -90 AND "participant_locations"."lat" <= 90 AND "participant_locations"."lng" >= -180 AND "participant_locations"."lng" <= 180),
	CONSTRAINT "check_participant_location_accuracy" CHECK ("participant_locations"."accuracy" >= 0)
);
--> statement-breakpoint
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
CREATE TABLE "missions" (
	"id" text PRIMARY KEY NOT NULL,
	"invitation_id" text NOT NULL,
	"participant_id" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "photo_likes" (
	"id" text PRIMARY KEY NOT NULL,
	"photo_id" text NOT NULL,
	"participant_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "photos" (
	"id" text PRIMARY KEY NOT NULL,
	"participant_id" text NOT NULL,
	"invitation_id" text NOT NULL,
	"image_key" text NOT NULL,
	"taken_at" timestamp with time zone,
	"exif_metadata" jsonb,
	"view_count" integer DEFAULT 0 NOT NULL,
	"like_count" integer DEFAULT 0 NOT NULL,
	"feedback_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "check_photo_view_count" CHECK ("photos"."view_count" >= 0),
	CONSTRAINT "check_photo_like_count" CHECK ("photos"."like_count" >= 0),
	CONSTRAINT "check_photo_feedback_count" CHECK ("photos"."feedback_count" >= 0)
);
--> statement-breakpoint
CREATE TABLE "feedback_likes" (
	"id" text PRIMARY KEY NOT NULL,
	"feedback_id" text NOT NULL,
	"participant_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feedbacks" (
	"id" text PRIMARY KEY NOT NULL,
	"participant_id" text NOT NULL,
	"invitation_id" text,
	"photo_id" text,
	"parent_id" text,
	"content" text NOT NULL,
	"like_count" integer DEFAULT 0 NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "check_feedback_ref" CHECK ("feedbacks"."invitation_id" IS NOT NULL OR "feedbacks"."photo_id" IS NOT NULL),
	CONSTRAINT "check_feedback_like_count" CHECK ("feedbacks"."like_count" >= 0)
);
--> statement-breakpoint
CREATE TABLE "notification_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"is_remind" boolean DEFAULT true NOT NULL,
	"is_feedback" boolean DEFAULT true NOT NULL,
	"is_invitation_date" boolean DEFAULT true NOT NULL,
	"is_photo" boolean DEFAULT true NOT NULL,
	"is_mission" boolean DEFAULT true NOT NULL,
	"is_participant_locations" boolean DEFAULT true NOT NULL,
	"is_event_locations" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "notification_settings_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"actor_user_id" text,
	"type" "notification_type" NOT NULL,
	"content" text NOT NULL,
	"target_type" "notification_target_type",
	"target_id" text,
	"is_read" boolean DEFAULT false NOT NULL,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "check_notification_target" CHECK (("notifications"."target_type" IS NOT NULL AND "notifications"."target_id" IS NOT NULL) OR ("notifications"."target_type" IS NULL AND "notifications"."target_id" IS NULL))
);
--> statement-breakpoint
CREATE TABLE "inquiries" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"inquiry_type" "inquiry_type" NOT NULL,
	"status" "inquiry_status" DEFAULT 'pending' NOT NULL,
	"title" varchar(200) NOT NULL,
	"content" text NOT NULL,
	"answer" text,
	"answered_at" timestamp with time zone,
	"admin_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "social_accounts" ADD CONSTRAINT "social_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_promoted_by_users_id_fk" FOREIGN KEY ("promoted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation_blocklists" ADD CONSTRAINT "invitation_blocklists_invitation_id_invitations_id_fk" FOREIGN KEY ("invitation_id") REFERENCES "public"."invitations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation_blocklists" ADD CONSTRAINT "invitation_blocklists_blocked_user_id_users_id_fk" FOREIGN KEY ("blocked_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation_blocklists" ADD CONSTRAINT "invitation_blocklists_blocked_by_user_id_users_id_fk" FOREIGN KEY ("blocked_by_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation_link_events" ADD CONSTRAINT "invitation_link_events_log_id_invitation_send_logs_id_fk" FOREIGN KEY ("log_id") REFERENCES "public"."invitation_send_logs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation_link_events" ADD CONSTRAINT "invitation_link_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation_send_logs" ADD CONSTRAINT "invitation_send_logs_invitation_id_invitations_id_fk" FOREIGN KEY ("invitation_id") REFERENCES "public"."invitations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation_send_logs" ADD CONSTRAINT "invitation_send_logs_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_template_id_invitation_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."invitation_templates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "participants" ADD CONSTRAINT "participants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "participants" ADD CONSTRAINT "participants_invitation_id_invitations_id_fk" FOREIGN KEY ("invitation_id") REFERENCES "public"."invitations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_locations" ADD CONSTRAINT "event_locations_invitation_id_invitations_id_fk" FOREIGN KEY ("invitation_id") REFERENCES "public"."invitations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "participant_locations" ADD CONSTRAINT "participant_locations_invitation_id_invitations_id_fk" FOREIGN KEY ("invitation_id") REFERENCES "public"."invitations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "participant_locations" ADD CONSTRAINT "participant_locations_participant_id_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."participants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mission_assignments" ADD CONSTRAINT "mission_assignments_mission_id_missions_id_fk" FOREIGN KEY ("mission_id") REFERENCES "public"."missions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mission_assignments" ADD CONSTRAINT "mission_assignments_participant_id_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."participants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "missions" ADD CONSTRAINT "missions_invitation_id_invitations_id_fk" FOREIGN KEY ("invitation_id") REFERENCES "public"."invitations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "missions" ADD CONSTRAINT "missions_participant_id_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."participants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "photo_likes" ADD CONSTRAINT "photo_likes_photo_id_photos_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."photos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "photo_likes" ADD CONSTRAINT "photo_likes_participant_id_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."participants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "photos" ADD CONSTRAINT "photos_participant_id_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."participants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "photos" ADD CONSTRAINT "photos_invitation_id_invitations_id_fk" FOREIGN KEY ("invitation_id") REFERENCES "public"."invitations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback_likes" ADD CONSTRAINT "feedback_likes_feedback_id_feedbacks_id_fk" FOREIGN KEY ("feedback_id") REFERENCES "public"."feedbacks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback_likes" ADD CONSTRAINT "feedback_likes_participant_id_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."participants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedbacks" ADD CONSTRAINT "feedbacks_participant_id_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."participants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedbacks" ADD CONSTRAINT "feedbacks_invitation_id_invitations_id_fk" FOREIGN KEY ("invitation_id") REFERENCES "public"."invitations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedbacks" ADD CONSTRAINT "feedbacks_photo_id_photos_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."photos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedbacks" ADD CONSTRAINT "feedbacks_parent_id_feedbacks_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."feedbacks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_settings" ADD CONSTRAINT "notification_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_admin_id_users_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_social_accounts_user_provider" ON "social_accounts" USING btree ("user_id","provider");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_social_accounts_provider_account" ON "social_accounts" USING btree ("provider","provider_account_id");--> statement-breakpoint
CREATE INDEX "idx_refresh_tokens_user" ON "refresh_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_blocklist_active" ON "invitation_blocklists" USING btree ("invitation_id","blocked_user_id") WHERE "invitation_blocklists"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_blocklist_invitation" ON "invitation_blocklists" USING btree ("invitation_id");--> statement-breakpoint
CREATE INDEX "idx_link_events_log_id" ON "invitation_link_events" USING btree ("log_id");--> statement-breakpoint
CREATE INDEX "idx_link_events_type" ON "invitation_link_events" USING btree ("event_type");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_participants_user_invitation" ON "participants" USING btree ("user_id","invitation_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_participant_locations_participant_invitation" ON "participant_locations" USING btree ("invitation_id","participant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_mission_assignments_mission_participant" ON "mission_assignments" USING btree ("mission_id","participant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_photo_likes_photo_participant" ON "photo_likes" USING btree ("photo_id","participant_id");--> statement-breakpoint
CREATE INDEX "idx_photos_invitation_taken_at" ON "photos" USING btree ("invitation_id","taken_at");--> statement-breakpoint
CREATE INDEX "idx_photos_deleted_at" ON "photos" USING btree ("deleted_at");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_feedback_likes_feedback_participant" ON "feedback_likes" USING btree ("feedback_id","participant_id");--> statement-breakpoint
CREATE INDEX "idx_inquiries_user_id" ON "inquiries" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_inquiries_deleted_at" ON "inquiries" USING btree ("deleted_at") WHERE "inquiries"."deleted_at" IS NULL;