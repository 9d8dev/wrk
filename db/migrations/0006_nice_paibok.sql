ALTER TABLE "user" ADD COLUMN "custom_domain" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "domain_status" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "domain_verified_at" timestamp;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_custom_domain_unique" UNIQUE("custom_domain");