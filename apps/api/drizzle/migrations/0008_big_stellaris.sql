ALTER TYPE "public"."term_type" ADD VALUE 'analytics';--> statement-breakpoint
ALTER TYPE "public"."term_type" ADD VALUE 'age';--> statement-breakpoint
ALTER TABLE "service_terms" ADD COLUMN "document_id" varchar(64);--> statement-breakpoint
ALTER TABLE "service_terms" ADD COLUMN "effective_date" timestamp with time zone;--> statement-breakpoint
UPDATE "service_terms" SET "document_id" = "term_type" || '-' || "version", "effective_date" = "published_at" WHERE "document_id" IS NULL;--> statement-breakpoint
ALTER TABLE "service_terms" ALTER COLUMN "document_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "service_terms" ALTER COLUMN "effective_date" SET NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_service_terms_document_id" ON "service_terms" USING btree ("document_id");
