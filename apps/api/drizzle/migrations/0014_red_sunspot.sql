ALTER TYPE "public"."term_type" ADD VALUE 'analytics';--> statement-breakpoint
ALTER TYPE "public"."term_type" ADD VALUE 'age';--> statement-breakpoint
ALTER TABLE "service_terms" ADD COLUMN "document_id" varchar(64) NOT NULL;--> statement-breakpoint
ALTER TABLE "service_terms" ADD COLUMN "effective_date" timestamp with time zone NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_notifications_user_id" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_service_terms_document_id" ON "service_terms" USING btree ("document_id");