CREATE TYPE "public"."settlement_split_type" AS ENUM('equal', 'custom');--> statement-breakpoint
CREATE TYPE "public"."settlement_status" AS ENUM('open', 'confirmed');--> statement-breakpoint
CREATE TABLE "settlement_expense_shares" (
	"id" text PRIMARY KEY NOT NULL,
	"expense_id" text NOT NULL,
	"participant_id" text NOT NULL,
	"share" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settlement_expenses" (
	"id" text PRIMARY KEY NOT NULL,
	"settlement_id" text NOT NULL,
	"payer_participant_id" text NOT NULL,
	"title" text NOT NULL,
	"amount" integer NOT NULL,
	"split_type" "settlement_split_type" DEFAULT 'equal' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "settlements" (
	"id" text PRIMARY KEY NOT NULL,
	"invitation_id" text NOT NULL,
	"status" "settlement_status" DEFAULT 'open' NOT NULL,
	"is_anonymized" boolean DEFAULT false NOT NULL,
	"share_token" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "settlement_expense_shares" ADD CONSTRAINT "settlement_expense_shares_expense_id_settlement_expenses_id_fk" FOREIGN KEY ("expense_id") REFERENCES "public"."settlement_expenses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settlement_expense_shares" ADD CONSTRAINT "settlement_expense_shares_participant_id_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."participants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settlement_expenses" ADD CONSTRAINT "settlement_expenses_settlement_id_settlements_id_fk" FOREIGN KEY ("settlement_id") REFERENCES "public"."settlements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settlement_expenses" ADD CONSTRAINT "settlement_expenses_payer_participant_id_participants_id_fk" FOREIGN KEY ("payer_participant_id") REFERENCES "public"."participants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_invitation_id_invitations_id_fk" FOREIGN KEY ("invitation_id") REFERENCES "public"."invitations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_settlement_share_expense_participant" ON "settlement_expense_shares" USING btree ("expense_id","participant_id");--> statement-breakpoint
CREATE INDEX "idx_settlement_expenses_settlement" ON "settlement_expenses" USING btree ("settlement_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_settlements_invitation" ON "settlements" USING btree ("invitation_id") WHERE "settlements"."deleted_at" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_settlements_share_token" ON "settlements" USING btree ("share_token");