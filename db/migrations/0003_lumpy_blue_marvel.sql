CREATE TABLE "subscription_history" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"subscription_id" text NOT NULL,
	"event_type" text NOT NULL,
	"event_data" json,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "polar_customer_id" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "subscription_status" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "subscription_id" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "subscription_product_id" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "subscription_current_period_end" timestamp;--> statement-breakpoint
ALTER TABLE "subscription_history" ADD CONSTRAINT "subscription_history_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;