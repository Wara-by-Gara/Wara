ALTER TABLE "conversations" ADD COLUMN "type" text DEFAULT 'direct' NOT NULL;
ALTER TABLE "conversations" ADD COLUMN "title" text;
