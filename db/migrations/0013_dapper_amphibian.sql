ALTER TABLE "media" DROP CONSTRAINT "media_project_id_project_id_fk";
--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "featured_image_id" text;--> statement-breakpoint
ALTER TABLE "project" DROP COLUMN "featured_image";