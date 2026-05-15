ALTER TABLE "social_accounts" ADD COLUMN "apple_refresh_token" text;--> statement-breakpoint
ALTER TABLE "social_accounts" ADD COLUMN "is_private_email" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD COLUMN "device_info" text;--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD COLUMN "ip_address" text;--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD COLUMN "last_used_at" timestamp with time zone;