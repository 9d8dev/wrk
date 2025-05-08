ALTER TABLE "project" RENAME COLUMN "content" TO "about";--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "image_ids" json DEFAULT '[]'::json;