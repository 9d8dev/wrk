CREATE TABLE "media" (
	"id" text PRIMARY KEY NOT NULL,
	"url" text NOT NULL,
	"project_id" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"slug" text NOT NULL,
	"cover_image" text NOT NULL,
	"cover_image_alt" text NOT NULL,
	"images" text[],
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"user_id" text NOT NULL,
	CONSTRAINT "project_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "media" ADD CONSTRAINT "media_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project" ADD CONSTRAINT "project_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;