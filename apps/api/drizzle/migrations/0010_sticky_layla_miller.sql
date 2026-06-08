CREATE TABLE "friend_hides" (
	"user_id" text NOT NULL,
	"hidden_user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "friend_hides_user_id_hidden_user_id_pk" PRIMARY KEY("user_id","hidden_user_id")
);
--> statement-breakpoint
ALTER TABLE "friend_hides" ADD CONSTRAINT "friend_hides_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friend_hides" ADD CONSTRAINT "friend_hides_hidden_user_id_users_id_fk" FOREIGN KEY ("hidden_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_friend_hides_user" ON "friend_hides" USING btree ("user_id");