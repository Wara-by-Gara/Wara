CREATE TABLE "invitation_questions" (
	"id" text PRIMARY KEY NOT NULL,
	"invitation_id" text NOT NULL,
	"question" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"required" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "question_answers" (
	"id" text PRIMARY KEY NOT NULL,
	"question_id" text NOT NULL,
	"participant_id" text NOT NULL,
	"answer" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "invitation_questions" ADD CONSTRAINT "invitation_questions_invitation_id_invitations_id_fk" FOREIGN KEY ("invitation_id") REFERENCES "public"."invitations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_answers" ADD CONSTRAINT "question_answers_question_id_invitation_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."invitation_questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_answers" ADD CONSTRAINT "question_answers_participant_id_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."participants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_invitation_questions_invitation" ON "invitation_questions" USING btree ("invitation_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_question_answers_question_participant" ON "question_answers" USING btree ("question_id","participant_id");--> statement-breakpoint
CREATE INDEX "idx_question_answers_participant" ON "question_answers" USING btree ("participant_id");
