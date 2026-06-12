CREATE TABLE IF NOT EXISTS "ai_generations" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"template_id" text NOT NULL,
	"source_image_key" text NOT NULL,
	"result_image_key" text,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"error_code" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ai_generations" ADD CONSTRAINT "ai_generations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ai_generations_user_created" ON "ai_generations" ("user_id","created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ai_generations_status" ON "ai_generations" ("status");
