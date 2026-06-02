-- 0002_fix_schema_drift.sql
-- 구 마이그레이션(0000_rapid_scream ~ 0010)과 통합 0000_gorgeous_white_tiger 사이의
-- 실제 DB 상태 차이를 메우는 브릿지 마이그레이션

-- ── 1. 누락 enum 타입 생성 ────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE "public"."main_cover_type" AS ENUM('image', 'gif');
EXCEPTION WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
  CREATE TYPE "public"."date_vote_poll_status" AS ENUM('open', 'closed', 'confirmed');
EXCEPTION WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
  CREATE TYPE "public"."date_vote_response" AS ENUM('good', 'maybe', 'bad');
EXCEPTION WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
  CREATE TYPE "public"."remind_type" AS ENUM('D+7', 'D+30', 'D+365');
EXCEPTION WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
  CREATE TYPE "public"."term_type" AS ENUM('service', 'privacy', 'marketing', 'location');
EXCEPTION WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- ── 2. invitations 테이블 컬럼 추가 ─────────────────────────────────────────
ALTER TABLE "invitations"
  ADD COLUMN IF NOT EXISTS "main_cover_type" "main_cover_type" DEFAULT 'image' NOT NULL,
  ADD COLUMN IF NOT EXISTS "main_gif_url" text;
--> statement-breakpoint

-- 기존 데이터: main_image_key가 있으면 image 타입 (이미 default 'image' 처리됨)

-- check constraint (이미 있으면 skip)
DO $$ BEGIN
  ALTER TABLE "invitations"
    ADD CONSTRAINT "check_cover_type_image"
    CHECK ("main_cover_type" <> 'image' OR ("main_image_key" IS NOT NULL AND "main_gif_url" IS NULL));
EXCEPTION WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
  ALTER TABLE "invitations"
    ADD CONSTRAINT "check_cover_type_gif"
    CHECK ("main_cover_type" <> 'gif' OR ("main_gif_url" IS NOT NULL AND "main_image_key" IS NULL));
EXCEPTION WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- ── 3. 누락 테이블 생성 ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "ai_image_jobs" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"invitation_id" text NOT NULL,
	"uploaded_image_key" text NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"result_key" text,
	"error_code" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "remind_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"invitation_id" text NOT NULL,
	"remind_type" "remind_type" NOT NULL,
	"sent_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "service_terms" (
	"id" text PRIMARY KEY NOT NULL,
	"term_type" "term_type" NOT NULL,
	"version" varchar(20) NOT NULL,
	"title" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"is_required" boolean DEFAULT false NOT NULL,
	"published_at" timestamp with time zone NOT NULL,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "user_term_agreements" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"term_id" text NOT NULL,
	"agreed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "date_vote_polls" (
	"id" text PRIMARY KEY NOT NULL,
	"invitation_id" text NOT NULL,
	"closes_at" timestamp with time zone NOT NULL,
	"status" "date_vote_poll_status" DEFAULT 'open' NOT NULL,
	"is_anonymous" boolean DEFAULT false NOT NULL,
	"confirmed_slot_id" text,
	"reminder_sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "date_vote_slots" (
	"id" text PRIMARY KEY NOT NULL,
	"poll_id" text NOT NULL,
	"date" date NOT NULL,
	"start_time" varchar(5),
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "date_vote_responses" (
	"id" text PRIMARY KEY NOT NULL,
	"slot_id" text NOT NULL,
	"participant_id" text NOT NULL,
	"response" "date_vote_response" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- ── 4. FK 추가 ───────────────────────────────────────────────────────────────
DO $$ BEGIN
  ALTER TABLE "ai_image_jobs" ADD CONSTRAINT "ai_image_jobs_user_id_users_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
  ALTER TABLE "ai_image_jobs" ADD CONSTRAINT "ai_image_jobs_invitation_id_invitations_id_fk"
    FOREIGN KEY ("invitation_id") REFERENCES "public"."invitations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
  ALTER TABLE "remind_logs" ADD CONSTRAINT "remind_logs_invitation_id_invitations_id_fk"
    FOREIGN KEY ("invitation_id") REFERENCES "public"."invitations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
  ALTER TABLE "service_terms" ADD CONSTRAINT "service_terms_created_by_users_id_fk"
    FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
  ALTER TABLE "user_term_agreements" ADD CONSTRAINT "user_term_agreements_user_id_users_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
  ALTER TABLE "user_term_agreements" ADD CONSTRAINT "user_term_agreements_term_id_service_terms_id_fk"
    FOREIGN KEY ("term_id") REFERENCES "public"."service_terms"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
  ALTER TABLE "date_vote_polls" ADD CONSTRAINT "date_vote_polls_invitation_id_invitations_id_fk"
    FOREIGN KEY ("invitation_id") REFERENCES "public"."invitations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
  ALTER TABLE "date_vote_slots" ADD CONSTRAINT "date_vote_slots_poll_id_date_vote_polls_id_fk"
    FOREIGN KEY ("poll_id") REFERENCES "public"."date_vote_polls"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
  ALTER TABLE "date_vote_responses" ADD CONSTRAINT "date_vote_responses_slot_id_date_vote_slots_id_fk"
    FOREIGN KEY ("slot_id") REFERENCES "public"."date_vote_slots"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
  ALTER TABLE "date_vote_responses" ADD CONSTRAINT "date_vote_responses_participant_id_participants_id_fk"
    FOREIGN KEY ("participant_id") REFERENCES "public"."participants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
