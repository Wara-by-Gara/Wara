CREATE TYPE "public"."term_type" AS ENUM('service', 'privacy', 'marketing', 'location');--> statement-breakpoint
CREATE TABLE "service_terms" (
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
CREATE TABLE "user_term_agreements" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"term_id" text NOT NULL,
	"agreed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "service_terms" ADD CONSTRAINT "service_terms_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_term_agreements" ADD CONSTRAINT "user_term_agreements_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_term_agreements" ADD CONSTRAINT "user_term_agreements_term_id_service_terms_id_fk" FOREIGN KEY ("term_id") REFERENCES "public"."service_terms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_user_term_agreements_user_term" ON "user_term_agreements" USING btree ("user_id","term_id");