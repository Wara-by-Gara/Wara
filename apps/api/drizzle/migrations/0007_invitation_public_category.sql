ALTER TABLE "invitations" ADD COLUMN "is_public" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "invitations" ADD COLUMN "category" varchar(20);--> statement-breakpoint
CREATE INDEX "idx_invitations_public_explore" ON "invitations" USING btree ("is_public","category") WHERE "deleted_at" IS NULL AND "is_public" = true;
