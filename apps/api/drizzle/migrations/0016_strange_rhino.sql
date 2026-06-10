CREATE TABLE "image_processing_jobs" (
	"id" text PRIMARY KEY NOT NULL,
	"target_type" varchar(30) NOT NULL,
	"target_id" text NOT NULL,
	"source_key" text NOT NULL,
	"thumbnail_key" text,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"mime_type" text,
	"size_bytes" integer,
	"error_code" text,
	"attempts" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "photos" ADD COLUMN "thumbnail_key" text;--> statement-breakpoint
CREATE INDEX "idx_image_jobs_target" ON "image_processing_jobs" USING btree ("target_type","target_id");--> statement-breakpoint
CREATE INDEX "idx_image_jobs_status" ON "image_processing_jobs" USING btree ("status");