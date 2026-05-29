ALTER TABLE "invitations" ADD COLUMN IF NOT EXISTS "rsvp_attending_emoji" varchar(10) NOT NULL DEFAULT '🎉';--> statement-breakpoint
ALTER TABLE "invitations" ADD COLUMN IF NOT EXISTS "rsvp_attending_label" varchar(20) NOT NULL DEFAULT '참석';--> statement-breakpoint
ALTER TABLE "invitations" ADD COLUMN IF NOT EXISTS "rsvp_maybe_emoji" varchar(10) NOT NULL DEFAULT '🤔';--> statement-breakpoint
ALTER TABLE "invitations" ADD COLUMN IF NOT EXISTS "rsvp_maybe_label" varchar(20) NOT NULL DEFAULT '미정';--> statement-breakpoint
ALTER TABLE "invitations" ADD COLUMN IF NOT EXISTS "rsvp_declined_emoji" varchar(10) NOT NULL DEFAULT '😭';--> statement-breakpoint
ALTER TABLE "invitations" ADD COLUMN IF NOT EXISTS "rsvp_declined_label" varchar(20) NOT NULL DEFAULT '불참';
