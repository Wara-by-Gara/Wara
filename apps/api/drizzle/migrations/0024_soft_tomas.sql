ALTER TABLE "invitations" ADD COLUMN "animation" varchar(50);--> statement-breakpoint
ALTER TABLE "invitations" ADD COLUMN "fee" varchar(100);--> statement-breakpoint
ALTER TABLE "invitations" ADD COLUMN "dress_code" varchar(100);--> statement-breakpoint
ALTER TABLE "invitations" ADD COLUMN "parking_info" text;--> statement-breakpoint
ALTER TABLE "invitations" ADD COLUMN "view_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_photos_invitation_fingerprint" ON "photos" USING btree ("invitation_id","exif_fingerprint") WHERE "deleted_at" IS NULL;