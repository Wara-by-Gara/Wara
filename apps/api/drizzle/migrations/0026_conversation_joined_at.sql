ALTER TABLE "conversation_participants" ADD COLUMN "joined_at" timestamp with time zone;
--> statement-breakpoint
UPDATE "conversation_participants" SET "joined_at" = "created_at" WHERE "joined_at" IS NULL;
--> statement-breakpoint
ALTER TABLE "conversation_participants" ALTER COLUMN "joined_at" SET DEFAULT now();
--> statement-breakpoint
ALTER TABLE "conversation_participants" ALTER COLUMN "joined_at" SET NOT NULL;
