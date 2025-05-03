ALTER TABLE "media" ADD COLUMN "featured_image" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "project" DROP COLUMN "featured_image";--> statement-breakpoint
ALTER TABLE "project" DROP COLUMN "images";