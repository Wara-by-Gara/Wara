ALTER TABLE "feedbacks" ADD COLUMN "attached_photo_id" text REFERENCES "photos"("id") ON DELETE SET NULL;
