ALTER TABLE "profile" DROP CONSTRAINT "profile_username_unique";--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "username" text;--> statement-breakpoint
ALTER TABLE "profile" DROP COLUMN "username";--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_username_unique" UNIQUE("username");