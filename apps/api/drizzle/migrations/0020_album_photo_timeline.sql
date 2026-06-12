-- schema에는 exif_fingerprint 컬럼이 있지만 ALTER ADD COLUMN 마이그레이션이 누락되어
-- 다음 인덱스 생성이 깨졌다. ADD COLUMN을 IF NOT EXISTS로 보강해 idempotent로 적용.
ALTER TABLE "photos" ADD COLUMN IF NOT EXISTS "exif_fingerprint" text;
--> statement-breakpoint
DROP INDEX IF EXISTS "idx_photos_invitation_fingerprint";
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_photos_invitation_fingerprint" ON "photos" ("invitation_id","exif_fingerprint");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "geocode_cache" (
	"id" text PRIMARY KEY NOT NULL,
	"lat_key" text NOT NULL,
	"lng_key" text NOT NULL,
	"address" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_geocode_cache_lat_lng" ON "geocode_cache" ("lat_key","lng_key");
