ALTER TABLE "photos" ADD COLUMN "exif_fingerprint" text;
--> statement-breakpoint
CREATE UNIQUE INDEX "uq_photos_invitation_fingerprint" ON "photos" ("invitation_id","exif_fingerprint");
--> statement-breakpoint
CREATE TABLE "geocode_cache" (
	"id" text PRIMARY KEY NOT NULL,
	"lat_key" text NOT NULL,
	"lng_key" text NOT NULL,
	"address" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "uq_geocode_cache_lat_lng" ON "geocode_cache" ("lat_key","lng_key");
