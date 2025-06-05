ALTER TABLE "project" DROP CONSTRAINT "project_slug_unique";
--> statement-breakpoint
ALTER TABLE "project" ADD CONSTRAINT "project_slug_user_id_unique" UNIQUE("slug", "user_id");
