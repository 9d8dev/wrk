DROP TABLE "media" CASCADE;--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "content" json;--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "featured_image" text;