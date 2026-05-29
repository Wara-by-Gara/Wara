ALTER TABLE "invitations"
  ADD COLUMN "rsvp_attending_emoji" varchar(10) NOT NULL DEFAULT '🎉',
  ADD COLUMN "rsvp_attending_label" varchar(20) NOT NULL DEFAULT '참석',
  ADD COLUMN "rsvp_maybe_emoji" varchar(10) NOT NULL DEFAULT '🤔',
  ADD COLUMN "rsvp_maybe_label" varchar(20) NOT NULL DEFAULT '미정',
  ADD COLUMN "rsvp_declined_emoji" varchar(10) NOT NULL DEFAULT '😭',
  ADD COLUMN "rsvp_declined_label" varchar(20) NOT NULL DEFAULT '불참';
