CREATE TABLE "theme" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"grid_type" text DEFAULT 'grid' NOT NULL,
	"mode" text DEFAULT 'light' NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "theme" ADD CONSTRAINT "theme_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;