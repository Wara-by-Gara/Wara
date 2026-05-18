ALTER TYPE "public"."social_provider" ADD VALUE 'google' BEFORE 'kakao';--> statement-breakpoint
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
ALTER TABLE "users" ADD COLUMN "refresh_token" text;--> statement-breakpoint
ALTER TABLE "mission_assignments" ADD CONSTRAINT "mission_assignments_mission_id_missions_id_fk" FOREIGN KEY ("mission_id") REFERENCES "public"."missions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mission_assignments" ADD CONSTRAINT "mission_assignments_participant_id_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."participants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_mission_assignments_mission_participant" ON "mission_assignments" USING btree ("mission_id","participant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_participant_locations_participant_invitation" ON "participant_locations" USING btree ("invitation_id","participant_id");