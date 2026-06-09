ALTER TYPE "public"."term_type" ADD VALUE 'analytics';--> statement-breakpoint
ALTER TYPE "public"."term_type" ADD VALUE 'age';--> statement-breakpoint
ALTER TABLE "refresh_tokens" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "refresh_tokens" CASCADE;--> statement-breakpoint
ALTER TABLE "service_terms" ADD COLUMN "document_id" varchar(64) NOT NULL;--> statement-breakpoint
ALTER TABLE "service_terms" ADD COLUMN "effective_date" timestamp with time zone NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_service_terms_document_id" ON "service_terms" USING btree ("document_id");
