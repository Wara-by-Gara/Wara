CREATE TYPE "public"."activity_event_type" AS ENUM('login', 'invitation_created', 'invitation_sent', 'participant_joined', 'link_opened', 'feedback_created');--> statement-breakpoint
ALTER TYPE "public"."term_type" ADD VALUE 'analytics';--> statement-breakpoint
ALTER TYPE "public"."term_type" ADD VALUE 'age';--> statement-breakpoint
CREATE TABLE "user_activity_events" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"event_type" "activity_event_type" NOT NULL,
	"metadata" jsonb,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "invitations" ADD COLUMN "is_public" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "invitations" ADD COLUMN "category" varchar(20);--> statement-breakpoint
ALTER TABLE "service_terms" ADD COLUMN "document_id" varchar(64) NOT NULL;--> statement-breakpoint
ALTER TABLE "service_terms" ADD COLUMN "effective_date" timestamp with time zone NOT NULL;--> statement-breakpoint
ALTER TABLE "user_activity_events" ADD CONSTRAINT "user_activity_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_activity_events_user_occurred" ON "user_activity_events" USING btree ("user_id","occurred_at");--> statement-breakpoint
CREATE INDEX "idx_activity_events_type_occurred" ON "user_activity_events" USING btree ("event_type","occurred_at");--> statement-breakpoint
CREATE INDEX "idx_activity_events_occurred" ON "user_activity_events" USING btree ("occurred_at");--> statement-breakpoint
CREATE INDEX "idx_invitations_public_explore" ON "invitations" USING btree ("is_public","category");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_service_terms_document_id" ON "service_terms" USING btree ("document_id");