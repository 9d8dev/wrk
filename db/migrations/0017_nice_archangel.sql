CREATE TABLE "social_link" (
	"id" text PRIMARY KEY NOT NULL,
	"profile_id" text NOT NULL,
	"platform" text NOT NULL,
	"url" text NOT NULL,
	"display_order" integer DEFAULT 0,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "social_link" ADD CONSTRAINT "social_link_profile_id_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;